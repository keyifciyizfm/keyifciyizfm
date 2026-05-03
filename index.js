const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
const masterNick = "Keyifciyiz_Fm"; 
const masterPass = "123456";

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if (data.nick === masterNick && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Şifre!');
        }
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'DJ' : 'Dinleyici';
        socket.color = (socket.role === 'DJ') ? '#f1c40f' : (data.color || "#2ecc71");
        socket.isMuted = false;
        
        users[socket.id] = { id: socket.id, nick: socket.nick, color: socket.color, role: socket.role };
        
        socket.emit('login success', { role: socket.role, myId: socket.id });
        io.emit('user list', Object.values(users));
    });

    socket.on('audio-stream', (data) => { socket.broadcast.emit('audio-receive', data); });

    socket.on('chat message', (data) => {
        if (socket.isMuted) return socket.emit('chat message', { user: 'SİSTEM', text: 'Susturuldunuz, mesaj gönderemezsiniz.', system: true });
        io.emit('chat message', { user: socket.nick, text: data.text, color: socket.color });
    });

    // YÖNETİCİ KOMUTLARI
    socket.on('admin-action', (data) => {
        if (socket.role !== 'DJ') return;
        const targetSocket = io.sockets.sockets.get(data.targetId);
        if (!targetSocket) return;

        if (data.action === 'kick') {
            targetSocket.disconnect();
        } else if (data.action === 'mute') {
            targetSocket.isMuted = !targetSocket.isMuted;
            targetSocket.emit('chat message', { user: 'SİSTEM', text: targetSocket.isMuted ? 'Yönetici tarafından susturuldunuz.' : 'Susturmanız kaldırıldı.', system: true });
        } else if (data.action === 'op') {
            users[data.targetId].role = 'Operatör';
            users[data.targetId].color = '#3498db'; // Mavi
            targetSocket.color = '#3498db';
            io.emit('user list', Object.values(users));
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            delete users[socket.id];
            io.emit('user list', Object.values(users));
        }
    });
});

server.listen(3000, () => console.log(`Radyo Yayında!`));
