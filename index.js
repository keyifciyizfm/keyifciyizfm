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
    socket.on('login', (data) => {
        // Basit bir admin kontrolü (Geliştirmek için DB eklenebilir)
        let role = (data.password === "admin123") ? "SÜPER ADMİN" : "ÜYE";
        users[socket.id] = { username: data.username, role: role };
        
        io.emit('userList', Object.values(users));
        socket.emit('loginSuccess', { role: role });
    });

    socket.on('chatMessage', (msg) => {
        const user = users[socket.id];
        io.emit('message', { user: user.username, role: user.role, text: msg });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('userList', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server ${PORT} portunda aktif.`));
