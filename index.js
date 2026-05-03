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

// YETKİ AYARLARI
const adminNick = "Halil"; // Kendi adını buraya yaz
const adminPass = "123456"; // Kendi şifreni buraya yaz

io.on('connection', (socket) => {
    
    socket.on('register', (data) => {
        if (registeredUsers[data.nick] || data.nick === adminNick) {
            socket.emit('auth error', 'Bu isim kullanılamaz!');
        } else {
            registeredUsers[data.nick] = { password: data.password };
            fs.writeFileSync(dbFile, JSON.stringify(registeredUsers));
            socket.emit('auth success', 'Kayıt başarılı! Giriş yapın.');
        }
    });

    socket.on('login', (data) => {
        if (bannedUsers.includes(data.nick)) return socket.emit('auth error', 'Engellendiniz!');

        let isAdmin = (data.nick === adminNick && data.password === adminPass);
        let user = registeredUsers[data.nick];

        if (isAdmin || (user && user.password === data.password)) {
            socket.nick = data.nick;
            socket.role = isAdmin ? 'Yönetici' : 'Dinleyici';
            socket.color = isAdmin ? '#ff4757' : '#2ecc71';
            
            activeUsers[socket.id] = { nick: socket.nick, role: socket.role, color: socket.color };
            
            socket.emit('login success', { role: socket.role });
            io.emit('user list', Object.values(activeUsers));
            io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} odaya girdi.`, system: true });
        } else {
            socket.emit('auth error', 'Hatalı giriş bilgileri!');
        }
    });

    socket.on('admin command', (data) => {
        if (socket.role !== 'Yönetici') return;
        const targetId = Object.keys(activeUsers).find(id => activeUsers[id].nick === data.targetNick);
        if (targetId) {
            if (data.action === 'kick') {
                io.to(targetId).emit('force logout', 'Atıldınız!');
                io.sockets.sockets.get(targetId).disconnect();
            } else if (data.action === 'ban') {
                bannedUsers.push(data.targetNick);
                io.to(targetId).emit('force logout', 'Banlandınız!');
                io.sockets.sockets.get(targetId).disconnect();
            }
        }
    });

    socket.on('chat message', (data) => {
        if (activeUsers[socket.id]) {
            io.emit('chat message', { 
                user: socket.nick, role: socket.role, 
                text: data.text, color: data.color, style: data.style 
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

server.listen(process.env.PORT || 3000);
