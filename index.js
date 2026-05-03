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

app.use(express.static(path.join(__dirname, 'public')));

let users = {};

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        // İSTEDİĞİN ADMİN BİLGİLERİ
        const isAdmin = (data.username === "keyifciyizfm" && data.password === "Keyif123");
        
        users[socket.id] = { 
            username: data.username, 
            role: isAdmin ? "ADMIN" : "USER",
            title: isAdmin ? "[ADMIN]" : "[Üye]",
            muted: false,
            id: socket.id 
        };

        socket.emit('authStatus', { role: users[socket.id].role });
        io.emit('updateUserList', Object.values(users));
    });

    socket.on('sendMessage', (data) => {
        const user = users[socket.id];
        if(user && !user.muted) {
            io.emit('message', { 
                user: `${user.title} ${user.username}`, 
                text: data.text,
                format: data.format 
            });
        }
    });

    socket.on('audioStream', (data) => { socket.broadcast.emit('audioPlay', data); });
    
    socket.on('adminAction', (data) => {
        if (users[socket.id]?.role === "ADMIN") {
            if (data.action === "kick") io.to(data.targetId).emit('kicked');
            if (data.action === "mute") users[data.targetId].muted = !users[data.targetId].muted;
            io.emit('updateUserList', Object.values(users));
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Radyo aktif!`));
