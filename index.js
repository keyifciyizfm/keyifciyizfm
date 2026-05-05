const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8 
});

app.use(express.static(path.join(__dirname, 'public')));

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.nick = data.nick || "Dinleyici";
        socket.role = (data.nick === masterNick && data.password === masterPass) ? 'DJ' : 'Dinleyici';
        socket.emit('login_success', { role: socket.role });
    });

    socket.on('voice-data', (data) => {
        if (socket.role === 'DJ') {
            socket.broadcast.emit('audio-stream', data);
        }
    });
});

server.listen(process.env.PORT || 3000, () => console.log("Radyo Aktif"));
