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

// ANA YÖNETİCİ BİLGİLERİ
const masterNick = "Halil"; 
const masterPass = "123456"; 

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;

    socket.on('join', (data) => {
        if (bannedIPs.includes(userIP)) return socket.emit('auth error', 'Engellendiniz!');
        if (data.nick === masterNick && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Şifre!');

        socket.nick = data.nick || "Misafir";
        // Sadece Halil "Yönetici" başlar, diğerleri "Dinleyici"
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        activeUsers[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, ip: userIP };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(activeUsers));
        io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} bağlandı.`, system: true });
    });

    socket.on('admin command', (data) => {
        // Komutu veren kişinin yetkisi var mı? (Yönetici veya Admin olmalı)
        if (socket.role !== 'Yönetici' && socket.role !== 'Admin') return;

        const targetSocketId = Object.keys(activeUsers).find(id => activeUsers[id].nick === data.targetNick);
        if (!targetSocketId) return;
        const targetSocket = io.sockets.sockets.get(targetSocketId);

        if (data.action === 'kick') {
            io.to(targetSocketId).emit('force logout', 'Odadan atıldınız!');
            targetSocket.disconnect();
        } else if (data.action === 'ban') {
            bannedIPs.push(activeUsers[targetSocketId].ip);
            io.to(targetSocketId).emit('force logout', 'Süresiz banlandınız!');
            targetSocket.disconnect();
        } else if (data.action === 'make_dj') {
            activeUsers[targetSocketId].role = 'DJ';
            activeUsers[targetSocketId].color = '#f1c40f'; // Altın sarısı
            if(targetSocket) targetSocket.role = 'DJ';
            io.emit('user list', Object.values(activeUsers));
        } else if (data.action === 'make_admin') {
            // Sadece ana yönetici birini Admin yapabilir
            if (socket.role !== 'Yönetici') return;
            activeUsers[targetSocketId].role = 'Admin';
            activeUsers[targetSocketId].color = '#e67e22'; // Turuncu
            if(targetSocket) targetSocket.role = 'Admin';
            io.emit('user list', Object.values(activeUsers));
        }
    });

    socket.on('chat message', (data) => {
        if (activeUsers[socket.id]) {
            const user = activeUsers[socket.id];
            io.emit('chat message', { 
                user: user.nick, role: user.role, 
                text: data.text, color: data.color || user.color, style: data.style 
            });
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
