const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // Büyük ses dosyaları için limiti artırdık (100MB)
});

app.use(express.static(path.join(__dirname, 'public')));

let connectedUsers = {};
let currentStream = null;

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        let role = (data.password === "admin123") ? "SÜPER ADMİN" : "Üye";
        connectedUsers[socket.id] = { id: socket.id, username: data.username, role: role };
        socket.emit('loginApproved', connectedUsers[socket.id]);
        io.emit('updateUserList', Object.values(connectedUsers));
        
        // Yeni giren biri varsa ve yayın açıksa yayını ona da gönder
        if (currentStream) {
            socket.emit('playAudio', currentStream);
        }
    });

    // MÜZİK YAYININI DAĞITMA
    socket.on('broadcastAudio', (data) => {
        const user = connectedUsers[socket.id];
        if (user && (user.role === "DJ" || user.role === "SÜPER ADMİN")) {
            currentStream = data; // Yayını kaydet
            io.emit('playAudio', data); // Herkese gönder
        }
    });

    socket.on('stopBroadcast', () => {
        const user = connectedUsers[socket.id];
        if (user && (user.role === "DJ" || user.role === "SÜPER ADMİN")) {
            currentStream = null;
            io.emit('stopAudio');
        }
    });

    socket.on('sendMessage', (message) => {
        const user = connectedUsers[socket.id];
        if (user) io.emit('message', { user: user.username, role: user.role, text: message });
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
        io.emit('updateUserList', Object.values(connectedUsers));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Radyo 3000 portunda hazır!`));
