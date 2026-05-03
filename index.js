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
        socket.color = (socket.role === 'DJ') ? '#f1c40f' : (data.color || "#2ecc71");
        users[socket.id] = { nick: socket.nick, color: socket.color, role: socket.role };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
        io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} bağlandı!`, system: true });
    });

    socket.on('audio-stream', (data) => {
        socket.broadcast.emit('audio-receive', data);
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', { 
            user: socket.nick, 
            text: data.text, 
            color: socket.color, 
            style: data.style 
        });
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const nick = users[socket.id].nick;
            delete users[socket.id];
            io.emit('user list', Object.values(users));
            io.emit('chat message', { user: 'SİSTEM', text: `${nick} ayrıldı.`, system: true });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Radyo Yayında!`));
