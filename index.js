const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// SES İÇİN BUFFER GÜÇLENDİRİLDİ
const io = new Server(server, {
    maxHttpBufferSize: 1e8, // 100MB
    pingTimeout: 60000
});

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let userStatus = {}; 
let currentBackground = ""; 
let adminCount = 0; 
let shutdownTimer = null; 

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

// ... (Mevcut parseEmojis fonksiyonu aynen kalsın) ...

io.on('connection', (socket) => {
    // --- MEVCUT JOIN LOGIC (HİÇ DOKUNMA) ---
    socket.on('join', (data) => {
        const isTargetAdmin = (data.nick === masterNick);
        if (adminCount === 0 && !isTargetAdmin) return socket.emit('auth error', 'Yayıncı şu an yayında değil, oda kapalı!');
        if (isTargetAdmin && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Yönetici Şifresi!');
        if (isTargetAdmin) {
            adminCount++;
            if (shutdownTimer) { clearTimeout(shutdownTimer); shutdownTimer = null; }
        }
        socket.nick = data.nick || "Misafir";
        socket.role = isTargetAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isTargetAdmin ? (data.color || '#ff4757') : '#2ecc71';
        if (userStatus[socket.nick] === undefined) userStatus[socket.nick] = 0;
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, status: userStatus[socket.nick] };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        socket.emit('status update', userStatus[socket.nick]);
        if (currentBackground !== "") socket.emit('background changed', currentBackground);
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    // --- RADYO MOTORU EKLEMESİ (ÜZERİNE EKLE) ---
    socket.on('audio-stream', (data) => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('audio-stream', data);
        }
    });

    socket.on('stream-status', (status) => {
        if (socket.role === 'Yönetici') {
            io.emit('chat message', { user: "SİSTEM", text: status ? "🔴 Canlı yayın başladı!" : "⚪ Yayın durduruldu.", color: status ? "#e74c3c" : "#95a5a6" });
        }
    });

    // ... (Mevcut update status, chat message, clear chat, disconnect fonksiyonları aynen kalsın) ...
    // Sadece disconnect içinde adminCount kontrolün zaten var, dokunma.
});

server.listen(process.env.PORT || 3000);
