const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8, // 100MB Ses verisi kapasitesi
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

let users = {};
let bannedIPs = [];
const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

io.on('connection', (socket) => {
    const userIP = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

    socket.on('join', (data) => {
        if (bannedIPs.includes(userIP)) return socket.emit('auth error', 'Girişiniz yasaklıdır!');
        if (data.nick === masterNick && data.password !== masterPass) return socket.emit('auth error', 'Hatalı DJ şifresi!');

        socket.nick = data.nick || "Misafir_" + Math.floor(Math.random() * 999);
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';

        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, ip: userIP };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
    });

    // SES AKTARIMI: DJ'den gelen veriyi herkese yay
    socket.on('audio-data', (data) => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('audio-stream', data);
        }
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            io.emit('chat message', {
                user: users[socket.id].nick,
                text: data.text,
                color: data.color || users[socket.id].color
            });
        }
    });

    socket.on('admin command', (data) => {
        if (socket.role !== 'Yönetici') return;
        const targetId = Object.keys(users).find(id => users[id].nick === data.targetNick);
        if (targetId) {
            if (data.action === 'kick') {
                io.to(targetId).emit('force logout', 'DJ tarafından odadan atıldınız!');
                io.sockets.sockets.get(targetId)?.disconnect();
            } else if (data.action === 'ban') {
                bannedIPs.push(users[targetId].ip);
                io.sockets.sockets.get(targetId)?.disconnect();
            }
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sohbet ve Ses Yayını ${PORT} portunda aktif.`));
