const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    maxHttpBufferSize: 1e8 // 100MB müzik dosyaları için limit
});

app.use(express.static(path.join(__dirname, 'public')));

let connectedUsers = {};

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        // Şifre 123 ise DJ yetkisi (SÜPER ADMİN) verir
        let role = (data.password === "123") ? "SÜPER ADMİN" : "DİNLEYİCİ";
        connectedUsers[socket.id] = { username: data.username, role: role, id: socket.id };
        socket.emit('loginApproved', connectedUsers[socket.id]);
        io.emit('updateUserList', Object.values(connectedUsers));
    });

    // DJ'den gelen ses verisini (Müzik/Mikrofon) herkese dağıtır
    socket.on('audioStream', (data) => {
        socket.broadcast.emit('audioPlay', data);
    });

    socket.on('sendMessage', (msg) => {
        const user = connectedUsers[socket.id];
        if (user) {
            io.emit('message', { user: user.username, role: user.role, text: msg });
        }
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
        io.emit('updateUserList', Object.values(connectedUsers));
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Radyo http://localhost:${PORT} adresinde aktif!`));
