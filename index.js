const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let userStatus = {}; 
let currentBackground = ""; 
let adminCount = 0; 
let shutdownTimer = null; // 60 saniye sayacı için

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isTargetAdmin = (data.nick === masterNick);
        
        // 60 Saniye Kuralı: Yönetici yoksa ve süre başlamamışsa girişi engelle
        if (adminCount === 0 && !isTargetAdmin && !shutdownTimer) {
            return socket.emit('auth error', 'Yayıncı şu an yayında değil!');
        }
        
        if (isTargetAdmin && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Şifre!');
        }
        
        if (isTargetAdmin) {
            adminCount++;
            if (shutdownTimer) { 
                clearTimeout(shutdownTimer); 
                shutdownTimer = null; 
                console.log("Yönetici geri döndü, kapanma iptal.");
            }
        }
        
        socket.nick = data.nick;
        socket.role = isTargetAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isTargetAdmin ? '#ff4757' : '#2ecc71';
        
        if (userStatus[socket.nick] === undefined) userStatus[socket.nick] = 0;
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, status: userStatus[socket.nick] };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        socket.emit('status update', userStatus[socket.nick]);
        if (currentBackground !== "") socket.emit('background changed', currentBackground);
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    socket.on('update color', (newColor) => {
        if (users[socket.id]) {
            users[socket.id].color = newColor;
            socket.color = newColor;
            io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
        }
    });

    socket.on('update status', (data) => {
        if (socket.role !== 'Yönetici') return;
        
        const oldStatus = userStatus[data.target]; // Eski durumu sakla
        userStatus[data.target] = data.state; // Yeni durumu ata
        
        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target) {
                users[id].status = data.state;
                
                // DÜZELTME 1: Susturma ve Açılma Bildirimleri
                if (data.state === 1) {
                    io.to(id).emit('chat message', { user: "SİSTEM", text: "⚠️ Susturuldunuz!", color: "#f1c40f", style: { bold: true } });
                } 
                else if (oldStatus === 1 && data.state === 0) {
                    io.to(id).emit('chat message', { user: "SİSTEM", text: "✅ Susturmanız kaldırıldı. Sohbete devam edebilirsiniz!", color: "#2ecc71", style: { bold: true } });
                }
                
                io.to(id).emit('status update', data.state);
            }
        });
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    socket.on('chat message', (data) => {
        const u = users[socket.id];
        if (!u) return;
        if (userStatus[u.nick] === 2) return;

        const msgData = { 
            user: u.nick, 
            text: data.text, 
            color: data.color || u.color, 
            style: data.style,
            target: data.target 
        };

        if (data.target && u.role === 'Yönetici') {
            const targetSocket = Object.values(users).find(usr => usr.nick === data.target);
            if (targetSocket) {
                socket.emit('chat message', msgData); 
                io.to(targetSocket.id).emit('chat message', msgData);
            }
            return;
        }

        if (userStatus[u.nick] === 1) {
            socket.emit('chat message', msgData);
            Object.values(users).forEach(usr => { 
                if (usr.role === 'Yönetici' && usr.id !== socket.id) {
                    io.to(usr.id).emit('chat message', { ...msgData, user: u.nick + " (Susturuldu)" });
                }
            });
        } else {
            io.emit('chat message', msgData);
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            if (users[socket.id].role === 'Yönetici') {
                adminCount--;
                // DÜZELTME 2: 60 Saniye Kuralı (Yönetici çıkınca tetiklenir)
                if (adminCount <= 0) {
                    shutdownTimer = setTimeout(() => { 
                        io.emit('force logout'); 
                        users = {}; 
                        adminCount = 0; 
                        shutdownTimer = null;
                    }, 60000);
                }
            }
            delete users[socket.id];
            io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
        }
    });

    socket.on('clear chat', () => { if (socket.role === 'Yönetici') io.emit('chat cleared'); });
    socket.on('change background', (url) => { if (socket.role === 'Yönetici') { currentBackground = url; io.emit('background changed', url); } });
});

server.listen(3000);
