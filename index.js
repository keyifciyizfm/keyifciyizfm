const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    maxHttpBufferSize: 1e8, // Büyük ses dosyaları için limit artırıldı
    cors: { origin: "*" } 
});

app.use(express.static(path.join(__dirname, 'public')));

let users = {};
let currentStreamer = null;

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isAdmin = (data.username === "keyifciyizfm" && data.password === "Keyif123");
        users[socket.id] = { 
            username: data.username, 
            role: isAdmin ? "ADMIN" : "USER",
            title: isAdmin ? "[DJ]" : "[Üye]",
            id: socket.id 
        };
        socket.emit('authStatus', { role: users[socket.id].role });
        io.emit('updateUserList', Object.values(users));
    });

    // Ses Yayını (Müzik + Mikrofon)
    socket.on('audioStream', (data) => {
        if (users[socket.id]?.role === "ADMIN") {
            socket.broadcast.emit('audioPlay', data);
        }
    });

    socket.on('stopStream', () => {
        if (users[socket.id]?.role === "ADMIN") {
            socket.broadcast.emit('audioStop');
        }
    });

    socket.on('sendMessage', (data) => {
        const user = users[socket.id];
        if(user) {
            io.emit('message', { 
                user: `${user.title} ${user.username}`, 
                text: data.text,
                format: data.format 
            });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Profesyonel Stüdyo Hazır!`));
