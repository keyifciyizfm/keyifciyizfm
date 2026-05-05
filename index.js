const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// maxHttpBufferSize: 100MB (Büyük şarkılar için gerekli)
const io = new Server(server, { maxHttpBufferSize: 1e8 });

app.use(express.static(path.join(__dirname, 'public')));

let adminNick = "Keyifciyiz_Fm";
let adminPass = "123456";

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isAdmin = (data.nick === adminNick && data.password === adminPass);
        socket.role = isAdmin ? 'Yönetici' : 'Dinleyici';
        socket.nick = data.nick;
        socket.emit('login-success', { role: socket.role });
        console.log(`${socket.nick} bağlandı. Rol: ${socket.role}`);
    });

    // Yönetici şarkı başlattığında diğerlerine haber ver
    socket.on('admin-play', (audioData) => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('client-play', audioData);
        }
    });

    // Yönetici yayını durdurduğunda
    socket.on('admin-stop', () => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('client-stop');
        }
    });

    socket.on('chat-message', (msg) => {
        io.emit('chat-message', { user: socket.nick, text: msg });
    });
});

server.listen(3000, () => console.log("Radyo Server 3000 portunda aktif!"));
