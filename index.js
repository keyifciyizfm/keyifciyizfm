const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// maxHttpBufferSize: 100MB şarkı yüklemelerine izin verir
const io = new Server(server, {
    maxHttpBufferSize: 1e8 
});

app.use(express.static(path.join(__dirname, 'public')));

let adminNick = "Keyifciyiz_Fm";
let adminPass = "123456";

io.on('connection', (socket) => {
    console.log('Yeni bağlantı:', socket.id);

    socket.on('join', (data) => {
        const isAdmin = (data.nick === adminNick && data.password === adminPass);
        socket.role = isAdmin ? 'Yönetici' : 'Dinleyici';
        socket.nick = data.nick || "Misafir";
        
        socket.emit('login-success', { role: socket.role });
        console.log(`${socket.nick} (${socket.role}) giriş yaptı.`);
    });

    // Müzik Verisini Dağıtma
    socket.on('broadcast-audio', (audioData) => {
        if (socket.role === 'Yönetici') {
            // Veriyi tüm dinleyicilere gönder
            socket.broadcast.emit('play-audio', audioData);
        }
    });

    // Yayını Durdurma
    socket.on('stop-broadcast', () => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('stop-audio');
        }
    });

    // Sohbet Mesajları
    socket.on('chat-message', (text) => {
        io.emit('chat-message', { user: socket.nick, text: text });
    });

    socket.on('disconnect', () => {
        console.log('Bağlantı koptu:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`--- Keyifciyiz FM Aktif ---`);
    console.log(`Adres: http://localhost:${PORT}`);
});
