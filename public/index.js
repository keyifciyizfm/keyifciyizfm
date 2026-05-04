const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // Ses paketleri için buffer genişletildi
});

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let isLive = false;
const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if (data.nick === masterNick && data.password !== masterPass) return;
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
        if(isLive) socket.emit('broadcast-status', true);
    });

    // SES AKIŞINI TÜM DİNLEYİCİLERE BAS
    socket.on('audio-stream', (data) => {
        if (socket.nick === masterNick) {
            socket.broadcast.emit('audio-data', data);
        }
    });

    socket.on('broadcast-status', (status) => {
        if (socket.nick === masterNick) {
            isLive = status;
            io.emit('broadcast-status', status);
        }
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            io.emit('chat message', { 
                user: users[socket.id].nick, 
                text: data.text, 
                color: users[socket.id].color 
            });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', Object.values(users));
    });
});

server.listen(process.env.PORT || 3000);
