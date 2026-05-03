const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456"; // DJ Giriş Şifresi

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if (data.nick === masterNick && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Şifre!');
        }
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
    });

    socket.on('voice-data', (data) => {
        if (socket.role === 'Yönetici') socket.broadcast.emit('audio-stream', data);
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            io.emit('chat message', { 
                user: users[socket.id].nick, 
                text: data.text, 
                color: data.color || users[socket.id].color 
            });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', Object.values(users));
    });
});

server.listen(3000, () => console.log('Radyo stüdyosu hazır: http://localhost:3000'));
