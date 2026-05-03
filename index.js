const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    maxHttpBufferSize: 1e8,
    cors: { origin: "*" } 
});

// Dosyaların okunması için kritik ayar
app.use(express.static(path.join(__dirname, 'public')));

let users = {};

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isAdmin = (data.password === "123");
        users[socket.id] = { 
            username: data.username, 
            role: isAdmin ? "ADMIN" : "USER",
            title: isAdmin ? "[DJ]" : "[Üye]",
            id: socket.id,
            format: { color: '#ff0000', bold: false, italic: false, size: 14 }
        };
        socket.emit('authStatus', { role: users[socket.id].role });
        io.emit('updateUserList', Object.values(users));
    });

    socket.on('sendMessage', (data) => {
        if(users[socket.id]) {
            io.emit('message', { 
                user: `${users[socket.id].title} ${users[socket.id].username}`, 
                text: data.text,
                format: data.format 
            });
        }
    });

    socket.on('audioStream', (data) => { socket.broadcast.emit('audioPlay', data); });
    socket.on('disconnect', () => { delete users[socket.id]; io.emit('updateUserList', Object.values(users)); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} üzerinde çalışıyor`));
