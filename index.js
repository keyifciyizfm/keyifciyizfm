const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; // Bağlı kullanıcıları burada tutacağız

io.on('connection', (socket) => {
    // Kullanıcı giriş yaptığında
    socket.on('join', (nick) => {
        socket.nick = nick || "Misafir-" + Math.floor(Math.random() * 100);
        users[socket.id] = socket.nick;
        
        // Herkese güncel listeyi ve giriş mesajını gönder
        io.emit('user list', Object.values(users));
        io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} aramıza katıldı!`, system: true });
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', { user: socket.nick, text: msg });
    });

    socket.on('disconnect', () => {
        if (socket.nick) {
            delete users[socket.id];
            io.emit('user list', Object.values(users));
            io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} ayrıldı.`, system: true });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Radyo yayında: ${PORT}`));
