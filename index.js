const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    // Ses paketlerinin kesintisiz iletimi için buffer ayarları
    maxHttpBufferSize: 1e7 
});

app.use(express.static(path.join(__dirname, 'public')));

// Kullanıcı verilerini tutan basit bir liste
let users = {};

io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı: ' + socket.id);

    // GİRİŞ İŞLEMİ
    socket.on('join', (data) => {
        let role = "Dinleyici";
        let nick = data.nick || "Misafir";

        // Yönetici girişi kontrolü (Buradaki şifreyi kendine göre değiştirebilirsin)
        if (nick === "Keyifciyiz_Fm" && data.password === "123456") {
            role = "Yönetici";
        }

        users[socket.id] = { nick, role };
        
        socket.emit('login success', { nick, role });
        console.log(`${nick} (${role}) olarak odaya katıldı.`);
    });

    // MESAJLAŞMA SİSTEMİ
    socket.on('chat message', (msg) => {
        const user = users[socket.id];
        if (user) {
            io.emit('chat message', {
                user: user.nick,
                text: msg.text
            });
        }
    });

    // --- SES MOTORU (KRİTİK KISIM) ---
    // DJ'den gelen ses paketlerini yakala ve diğer herkese gönder
    socket.on('audio-stream', (buffer) => {
        const user = users[socket.id];
        // Sadece yönetici (DJ) ses gönderebilir
        if (user && user.role === "Yönetici") {
            socket.broadcast.emit('audio-out', buffer);
        }
    });

    // BAĞLANTI KESİLDİĞİNDE
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            console.log(`${users[socket.id].nick} ayrıldı.`);
            delete users[socket.id];
        }
    });
});

// Render için dinamik port ayarı
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda keyifle çalışıyor...`);
});
