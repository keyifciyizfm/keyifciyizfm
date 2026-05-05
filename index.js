const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // Ses verisi akışı için yüksek kapasite
});

// Statik dosyaları (html, css, js) "public" klasöründen çeker
app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let userStatus = {}; 
let currentBackground = ""; 
let adminCount = 0; 
let shutdownTimer = null; 

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isTargetAdmin = (data.nick === masterNick);
        
        if (adminCount === 0 && !isTargetAdmin) {
            return socket.emit('auth error', 'Yayıncı şu an yayında değil!');
        }
        
        if (isTargetAdmin && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Yönetici Şifresi!');
        }
        
        if (isTargetAdmin) {
            adminCount++;
            if (shutdownTimer) { clearTimeout(shutdownTimer); shutdownTimer = null; }
        }
        
        socket.nick = data.nick || "Misafir";
        socket.role = isTargetAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isTargetAdmin ? '#ff4757' : '#2ecc71';
        
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, status: 0 };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    // RADYO SES AKIŞI: Yönetici'den gelen sesi diğer herkese dağıtır
    socket.on('audio-stream', (data) => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('audio-stream', data);
        }
    });

    socket.on('stream-status', (status) => {
        if (socket.role === 'Yönetici') {
            io.emit('chat message', { 
                user: "SİSTEM", 
                text: status ? "🔴 Yayın Başladı!" : "⚪ Yayın Durduruldu.", 
                color: "#f1c40f" 
            });
        }
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            io.emit('chat message', { user: u.nick, text: data.text, color: u.color });
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            if (users[socket.id].role === 'Yönetici') {
                adminCount--;
                if (adminCount <= 0) {
                    shutdownTimer = setTimeout(() => { io.emit('force logout'); users = {}; }, 60000);
                }
            }
            delete users[socket.id];
            io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu http://localhost:${PORT} üzerinde çalışıyor`));
