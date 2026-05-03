const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const dbFile = './users.json';
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({}));
let registeredUsers = JSON.parse(fs.readFileSync(dbFile));

let activeUsers = {}; 
let bannedUsers = []; 

// --- YÖNETİCİ VE YETKİ AYARLARI ---
const adminConfig = {
    nick: "Admin",    // Buraya kendi kullanıcı adını yaz
    pass: "12345"     // Buraya kendi şifreni yaz
};

const roles = {
    [adminConfig.nick]: 'Yönetici',
    'DJ_Aysima': 'DJ',
    'Mod_Rehber': 'Sorumlu'
};

io.on('connection', (socket) => {
    
    socket.on('register', (data) => {
        if (registeredUsers[data.nick] || data.nick === adminConfig.nick) {
            socket.emit('auth error', 'Bu kullanıcı adı zaten alınmış!');
        } else {
            registeredUsers[data.nick] = { password: data.password };
            fs.writeFileSync(dbFile, JSON.stringify(registeredUsers));
            socket.emit('auth success', 'Kayıt başarılı!');
        }
    });

    socket.on('login', (data) => {
        if (bannedUsers.includes(data.nick)) {
            return socket.emit('auth error', 'Girişiniz engellendi!');
        }

        let isAdmin = (data.nick === adminConfig.nick && data.password === adminConfig.pass);
        let user = registeredUsers[data.nick];

        if (isAdmin || (user && user.password === data.password)) {
            socket.nick = data.nick;
            socket.role = roles[data.nick] || 'Dinleyici';
            // Yönetici ise rengi kırmızı olsun
            socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
            
            activeUsers[socket.id] = { nick: socket.nick, role: socket.role, color: socket.color };
            
            socket.emit('login success', { role: socket.role });
            io.emit('user list', Object.values(activeUsers));
            io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} (${socket.role}) giriş yaptı!`, system: true });
        } else {
            socket.emit('auth error', 'Hatalı kullanıcı adı veya şifre!');
        }
    });

    // --- YÖNETİCİ KOMUTLARI (Kick/Ban) ---
    socket.on('admin command', (data) => {
        if (socket.role !== 'Yönetici') return;

        const targetSocketId = Object.keys(activeUsers).find(id => activeUsers[id].nick === data.targetNick);
        
        if (data.action === 'kick' && targetSocketId) {
            io.to(targetSocketId).emit('force logout', 'Yönetici tarafından odadan atıldınız!');
            io.sockets.sockets.get(targetSocketId).disconnect();
        } 
        else if (data.action === 'ban' && data.targetNick !== adminConfig.nick) {
            bannedUsers.push(data.targetNick);
            if (targetSocketId) {
                io.to(targetSocketId).emit('force logout', 'Süresiz engellendiniz!');
                io.sockets.sockets.get(targetSocketId).disconnect();
            }
        }
    });

    socket.on('chat message', (data) => {
        if (activeUsers[socket.id]) {
            io.emit('chat message', { 
                user: socket.nick, 
                role: socket.role, 
                text: data.text, 
                color: data.color, 
                style: data.style 
            });
        }
    });

    socket.on('disconnect', () => {
        if (activeUsers[socket.id]) {
            delete activeUsers[socket.id];
            io.emit('user list', Object.values(activeUsers));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Yönetici Paneli Aktif!`));
