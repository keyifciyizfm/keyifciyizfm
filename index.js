const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Kullanıcı verilerini saklayacak dosya yolu
const dbFile = './users.json';

// Dosya yoksa oluştur
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({}));
}

// Kayıtlı kullanıcıları dosyadan oku
let registeredUsers = JSON.parse(fs.readFileSync(dbFile));

let activeUsers = {}; 

io.on('connection', (socket) => {
    
    // YENİ KAYIT İŞLEMİ
    socket.on('register', (data) => {
        if (registeredUsers[data.nick]) {
            socket.emit('auth error', 'Bu kullanıcı adı zaten alınmış!');
        } else {
            // Şifreyi ve nicki kaydet
            registeredUsers[data.nick] = { password: data.password };
            fs.writeFileSync(dbFile, JSON.stringify(registeredUsers));
            socket.emit('auth success', 'Kayıt başarılı! Giriş yapabilirsiniz.');
        }
    });

    // GİRİŞ YAPMA İŞLEMİ
    socket.on('login', (data) => {
        let user = registeredUsers[data.nick];
        if (user && user.password === data.password) {
            socket.nick = data.nick;
            socket.color = "#2ecc71"; // Varsayılan renk
            activeUsers[socket.id] = { nick: socket.nick, color: socket.color };
            
            socket.emit('login success');
            io.emit('user list', Object.values(activeUsers));
            io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} odaya giriş yaptı!`, system: true });
        } else {
            socket.emit('auth error', 'Hatalı kullanıcı adı veya şifre!');
        }
    });

    // MESAJLAŞMA
    socket.on('chat message', (data) => {
        if (activeUsers[socket.id]) {
            io.emit('chat message', { 
                user: socket.nick, 
                text: data.text, 
                color: data.color, 
                style: data.style 
            });
        }
    });

    // RENK DEĞİŞTİRME
    socket.on('change color', (newColor) => {
        if (activeUsers[socket.id]) {
            activeUsers[socket.id].color = newColor;
            socket.color = newColor;
            io.emit('user list', Object.values(activeUsers));
        }
    });

    // AYRILMA
    socket.on('disconnect', () => {
        if (activeUsers[socket.id]) {
            const nick = activeUsers[socket.id].nick;
            delete activeUsers[socket.id];
            io.emit('user list', Object.values(activeUsers));
            io.emit('chat message', { user: 'SİSTEM', text: `${nick} ayrıldı.`, system: true });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Radyo Paneli ${PORT} portunda hazır!`));
