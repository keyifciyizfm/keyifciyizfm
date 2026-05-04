const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 5e7 // 50MB limit
});

app.use(express.static(path.join(__dirname, 'public')));

let currentDJ = null;

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        let role = (data.password === "admin123") ? "SÜPER ADMİN" : "Üye";
        socket.emit('loginApproved', { username: data.username, role: role });
    });

    // MÜZİK VE MİKROFON YAYINI
    socket.on('streamData', (data) => {
        // DJ veriyi gönderdiğinde herkese (kendisi hariç) yayınlar
        socket.broadcast.emit('playStream', data);
    });

    socket.on('stopStream', () => {
        io.emit('killStream');
    });

    socket.on('sendMessage', (m) => {
        io.emit('message', m);
    });
});

server.listen(3000, () => console.log("Profesyonel Radyo 3000'de!"));
