const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let bannedIPs = [];
let currentTrack = null;

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;

    socket.on('join', (data) => {
        if (bannedIPs.includes(userIP)) return socket.emit('auth error', 'Girişiniz engellendi!');
        if (data.nick === masterNick && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Şifre!');
        
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, ip: userIP };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));

        if(currentTrack) {
            socket.emit('play-track', currentTrack);
        }
    });

    socket.on('dj-play', (trackName) => {
        if (socket.role === 'Yönetici') {
            currentTrack = trackName;
            io.emit('play-track', trackName);
        }
    });

    socket.on('dj-stop', () => {
        if (socket.role === 'Yönetici') {
            currentTrack = null;
            io.emit('stop-track');
        }
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            // Mesaj boş değilse gönder
            if(data.text && data.text.trim() !== "") {
                io.emit('chat message', { 
                    user: u.nick, 
                    text: data.text, 
                    color: u.color 
                });
            }
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) { 
            delete users[socket.id]; 
            io.emit('user list', Object.values(users)); 
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
