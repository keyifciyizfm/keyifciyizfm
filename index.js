const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // Ses paketleri için yüksek bellek sınırı
});

// Statik dosyalar için public klasörünü kullan
app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        // Admin Giriş Kontrolü
        if (data.nick === masterNick && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Şifre!');
        }
        
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        users[socket.id] = { 
            id: socket.id, 
            nick: socket.nick, 
            role: socket.role, 
            color: socket.color 
        };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
    });

    // --- SES İLETİMİ ---
    socket.on('audio-stream', (data) => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('audio-data', data);
        }
    });

    // Mesajlaşma
    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            io.emit('chat message', { 
                user: users[socket.id].nick, 
                text: data.text, 
                color: data.color || users[socket.id].color, 
                style: data.style 
            });
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            delete users[socket.id];
            io.emit('user list', Object.values(users));
        }
    });
});

  // ÇIKIŞ
  socket.on("disconnect", () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit("kullanicilar", users);
  });

});

http.listen(process.env.PORT || 3000);
