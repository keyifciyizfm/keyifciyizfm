const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e8 });

// Dosyaların /public klasörü içinde olduğunu belirtir
app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
const masterNick = "Keyifciyiz_Fm";

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.nick = data.nick || "Misafir";
        users[socket.id] = { nick: socket.nick };
        socket.emit('login success', { nick: socket.nick });
    });

    // DJ'den gelen ses verisini herkese dağıtır
    socket.on('audio-stream', (data) => {
        if (socket.nick === masterNick) {
            socket.broadcast.emit('audio-data', data);
        }
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', { user: socket.nick, text: data.text });
    });

    socket.on('disconnect', () => { delete users[socket.id]; });
});

server.listen(process.env.PORT || 3000);
