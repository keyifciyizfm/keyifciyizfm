const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// CORS ayarlarını Render uyumlu hale getirdik
const io = new Server(server, { 
    maxHttpBufferSize: 1e8,
    cors: { origin: "*" } 
});

app.use(express.static(path.join(__dirname, 'public')));

let connectedUsers = {};

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    socket.on('join', (data) => {
        const isAdmin = (data.password === "123");
        connectedUsers[socket.id] = { 
            username: data.username || "Misafir", 
            role: isAdmin ? "ADMIN" : "USER",
            title: isAdmin ? "[DJ]" : "[Üye]",
            muted: false,
            id: socket.id 
        };
        socket.emit('authStatus', { role: connectedUsers[socket.id].role });
        io.emit('updateUserList', Object.values(connectedUsers));
        console.log(`${data.username} giriş yaptı.`);
    });

    socket.on('sendMessage', (data) => {
        const user = connectedUsers[socket.id];
        if(user && !user.muted) {
            io.emit('message', { 
                user: `${user.title} ${user.username}`, 
                text: data.text,
                format: data.format 
            });
        }
    });

    socket.on('audioStream', (data) => { socket.broadcast.emit('audioPlay', data); });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
        io.emit('updateUserList', Object.values(connectedUsers));
    });
});

// Render için PORT ayarı
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
