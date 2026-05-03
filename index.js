const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Kullanıcı veritabanını yükle (users.json)
let dbFile = './users.json';
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({}));
let registeredUsers = JSON.parse(fs.readFileSync(dbFile));

let activeUsers = {}; 

io.on('connection', (socket) => {
    
    // KAYIT OLMA İŞLEMİ
    socket.on('register', (data) => {
        if (registeredUsers[data.nick]) {
            socket.emit('auth error', 'Bu kullanıcı adı zaten alınmış!');
        } else {
            registeredUsers[data.nick] = { password: data.password };
            fs.writeFileSync(dbFile, JSON.stringify(registeredUsers));
            socket.emit('auth success', 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
        }
    });

    // GİRİŞ YAPMA İŞLEMİ
    socket.on('login', (data) => {
        let user = registeredUsers[data.nick];
        if (user && user.password === data.password) {
            socket.nick = data.nick;
            socket.color = "#2ecc71";
            activeUsers[socket.id] = { nick: socket.nick, color: socket.color };
            
            socket.emit('login success', { nick: socket.nick });
            io.emit('user list', Object.values(activeUsers));
            io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} odaya giriş yaptı!`, system: true });
        } else {
            socket.emit('auth error', 'Hatalı kullanıcı adı veya şifre!');
        }
    });

    socket.on('chat message', (data) => {
        if (activeUsers[socket.id]) {
            io.emit('chat message', { 
                user: socket.nick, 
                text: data.text, 
                color: data.color, 
                style: data.style 
            });
        }
    });

    socket.on('disconnect', () => {
        if (activeUsers[socket.id]) {
            const nick = activeUsers[socket.id].nick;
            delete activeUsers[socket.id];
            io.emit('user list', Object.values(activeUsers));
            io.emit('chat message', { user: 'SİSTEM', text: `${nick} ayrıldı.`, system: true });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sohbet ve Kayıt Sistemi Aktif!`));
