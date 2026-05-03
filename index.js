const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.nick = data.nick || "Misafir";
        socket.color = "#2ecc71"; // Varsayılan renk yeşil
        users[socket.id] = { nick: socket.nick, color: socket.color };
        
        io.emit('user list', Object.values(users));
        io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} bağlandı!`, system: true });
    });

    // Renk değişim komutu
    socket.on('change color', (newColor) => {
        if (users[socket.id]) {
            users[socket.id].color = newColor;
            socket.color = newColor;
            io.emit('user list', Object.values(users));
        }
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', { 
            user: socket.nick, 
            text: data.text, 
            color: socket.color, 
            size: data.size 
        });
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const nick = users[socket.id].nick;
            delete users[socket.id];
            io.emit('user list', Object.values(users));
            io.emit('chat message', { user: 'SİSTEM', text: `${nick} ayrıldı.`, system: true });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Radyo Yayında!`));
