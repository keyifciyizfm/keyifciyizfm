const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let bannedIPs = [];

// YÖNETİCİ AYARLARI
const masterNick = "Keyifciyiz_Fm"; 
const masterPass = "123456";

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;

    socket.on('join', (data) => {
        if (bannedIPs.includes(userIP)) return socket.emit('auth error', 'Girişiniz engellendi!');
        if (data.nick === masterNick && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Şifre!');

        socket.nick = data.nick || "Misafir";
        // Yönetici girerse rolü DJ olur
        socket.role = (data.nick === masterNick) ? 'DJ' : 'Dinleyici';
        socket.color = (socket.role === 'DJ') ? '#f1c40f' : '#2ecc71';
        
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, ip: userIP };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            io.emit('chat message', { 
                user: u.nick, 
                role: u.role,
                text: data.text, 
                color: data.color || u.color, 
                style: data.style 
            });
        }
    });

    socket.on('admin command', (data) => {
        if (socket.role !== 'DJ') return;
        const targetId = Object.keys(users).find(id => users[id].nick === data.targetNick);
        if (!targetId) return;

        if (data.action === 'kick') {
            io.to(targetId).emit('force logout', 'Odadan çıkarıldınız.');
            io.sockets.sockets.get(targetId)?.disconnect();
        } else if (data.action === 'ban') {
            bannedIPs.push(users[targetId].ip);
            io.to(targetId).emit('force logout', 'Banlandınız.');
            io.sockets.sockets.get(targetId)?.disconnect();
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            delete users[socket.id];
            io.emit('user list', Object.values(users));
        }
    });
});

server.listen(process.env.PORT || 3000);
