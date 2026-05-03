const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Yeni kullanıcı girişi
    socket.on('join', (username) => {
        socket.username = username;
        io.emit('chat message', { user: 'SİSTEM', text: `${username} yayına bağlandı.`, type: 'system' });
    });

    // Mesajlaşma
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    // Admin komutları (Yayın durdurma vb.)
    socket.on('admin command', (cmd) => {
        io.emit('system command', cmd);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu aktif: http://localhost:${PORT}`);
});
