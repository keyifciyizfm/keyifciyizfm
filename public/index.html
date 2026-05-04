const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e8 });

app.use(express.static(path.join(__dirname, 'public')));

let connectedUsers = {};

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isAdmin = (data.password === "123");
        connectedUsers[socket.id] = { 
            username: data.username, 
            role: isAdmin ? "ADMIN" : "USER",
            title: isAdmin ? "[DJ]" : "[Üye]",
            muted: false,
            id: socket.id 
        };
        socket.emit('authStatus', { role: connectedUsers[socket.id].role });
        io.emit('updateUserList', Object.values(connectedUsers));
    });

    socket.on('assignTitle', (data) => {
        if (connectedUsers[socket.id]?.role === "ADMIN" && connectedUsers[data.userId]) {
            connectedUsers[data.userId].title = data.title;
            io.emit('updateUserList', Object.values(connectedUsers));
        }
    });

    socket.on('muteUser', (data) => {
        if (connectedUsers[socket.id]?.role === "ADMIN" && connectedUsers[data.userId]) {
            connectedUsers[data.userId].muted = !connectedUsers[data.userId].muted;
            io.emit('updateUserList', Object.values(connectedUsers));
        }
    });

    socket.on('kickUser', (data) => {
        if (connectedUsers[socket.id]?.role === "ADMIN" && connectedUsers[data.userId]) {
            io.to(data.userId).emit('kicked');
        }
    });

    socket.on('audioStream', (data) => { socket.broadcast.emit('audioPlay', data); });

    socket.on('sendMessage', (msg) => {
        const user = connectedUsers[socket.id];
        if(user && !user.muted) {
            io.emit('message', { user: `${user.title} ${user.username}`, role: user.role, text: msg });
        }
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
        io.emit('updateUserList', Object.values(connectedUsers));
    });
});

server.listen(3000, () => console.log("Radyo hazır: http://localhost:3000"));
