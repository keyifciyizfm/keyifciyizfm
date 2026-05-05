const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e7 // Ses paketleri için buffer limitini artırdık
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    // Giriş ve Rol Tanımlama
    socket.on('join', (data) => {
        socket.nick = data.nick;
        socket.role = (data.nick === "Keyifciyiz_Fm") ? "admin" : "user";
        console.log(`${socket.nick} bağlandı as ${socket.role}`);
    });

    // SES İLETİMİ: Yöneticiden gelen ham ses verisini herkese yayınla
    socket.on('audio-stream', (data) => {
        if (socket.role === "admin") {
            socket.broadcast.emit('audio-data', data);
        }
    });

    socket.on('disconnect', () => {
        console.log("Bir kullanıcı ayrıldı.");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
