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
const masterPass = "123456";

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if (data.nick === masterNick && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Şifre!');
        }
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'DJ' : 'Dinleyici';
        socket.color = (socket.role === 'DJ') ? '#f1c40f' : "#2ecc71";
        users[socket.id] = { nick: socket.nick, color: socket.color, role: socket.role };
        socket.emit('login success', { role: socket.role });
        io.emit('user list', Object.values(users));
    });

    // SES PAKETİ AKTARIMI
    socket.on('audio-stream', (data) => {
        socket.broadcast.emit('audio-receive', data);
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', { user: socket.nick, text: data.text, color: socket.color, style: data.style });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', Object.values(users));
    });
});

server.listen(process.env.PORT || 3000);
