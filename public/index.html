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

// SENİN BİLGİLERİN
const adminNick = "Halil"; 
const adminPass = "123456"; 

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;

    socket.on('join', (data) => {
        if (bannedIPs.includes(userIP)) {
            return socket.emit('auth error', 'Bu odaya girişiniz engellenmiştir!');
        }

        if (data.nick === adminNick && data.password !== adminPass) {
            return socket.emit('auth error', 'Yönetici şifresi hatalı!');
        }

        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === adminNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        activeUsers[socket.id] = { nick: socket.nick, role: socket.role, color: socket.color, ip: userIP };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(activeUsers));
        io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} bağlandı.`, system: true });
    });

    socket.on('admin command', (data) => {
        if (socket.role !== 'Yönetici') return;
        const targetId = Object.keys(activeUsers).find(id => activeUsers[id].nick === data.targetNick);
        
        if (targetId) {
            if (data.action === 'kick') {
                io.to(targetId).emit('force logout', 'Yönetici tarafından atıldınız!');
                io.sockets.sockets.get(targetId).disconnect();
            } else if (data.action === 'ban') {
                bannedIPs.push(activeUsers[targetId].ip);
                io.to(targetId).emit('force logout', 'Süresiz engellendiniz!');
                io.sockets.sockets.get(targetId).disconnect();
            }
        }
    });

    socket.on('chat message', (data) => {
        if (activeUsers[socket.id]) {
            io.emit('chat message', { 
                user: socket.nick, role: socket.role, 
                text: data.text, color: data.color, style: data.style 
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
