const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let activeUsers = {}; 
let bannedIPs = []; 

const masterNick = "Halil"; 
const masterPass = "123456"; 

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;

    socket.on('join', (data) => {
        if (bannedIPs.includes(userIP)) return socket.emit('auth error', 'Girişiniz engellendi!');
        if (data.nick === masterNick && data.password !== masterPass) return socket.emit('auth error', 'Şifre Hatalı!');

        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        activeUsers[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, ip: userIP };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(activeUsers));
        io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} bağlandı.`, system: true });
    });

    socket.on('admin command', (data) => {
        if (socket.role !== 'Yönetici' && socket.role !== 'Admin') return;
        const targetId = Object.keys(activeUsers).find(id => activeUsers[id].nick === data.targetNick);
        if (!targetId) return;

        if (data.action === 'kick') {
            io.to(targetId).emit('force logout', 'Atıldınız!');
            io.sockets.sockets.get(targetId)?.disconnect();
        } else if (data.action === 'ban') {
            bannedIPs.push(activeUsers[targetId].ip);
            io.to(targetId).emit('force logout', 'Banlandınız!');
            io.sockets.sockets.get(targetId)?.disconnect();
        } else if (data.action === 'make_dj') {
            activeUsers[targetId].role = 'DJ';
            activeUsers[targetId].color = '#f1c40f';
            io.emit('user list', Object.values(activeUsers));
        } else if (data.action === 'make_admin') {
            if (socket.role !== 'Yönetici') return;
            activeUsers[targetId].role = 'Admin';
            activeUsers[targetId].color = '#e67e22';
            io.emit('user list', Object.values(activeUsers));
        }
    });

    socket.on('chat message', (data) => {
        if (activeUsers[socket.id]) {
            const u = activeUsers[socket.id];
            io.emit('chat message', { user: u.nick, role: u.role, text: data.text, color: data.color || u.color, style: data.style });
        }
    });

    socket.on('disconnect', () => {
        if (activeUsers[socket.id]) {
            delete activeUsers[socket.id];
            io.emit('user list', Object.values(activeUsers));
        }
    });
});

server.listen(process.env.PORT || 3000);
