const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { ShoutStreamer } = require('shoutstreamer'); // Radyo paketi

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Dosyaların okunacağı klasör (public klasörü varsa oraya bakar)
app.use(express.static(path.join(__dirname, 'public')));
// Eğer index.html ana dizindeyse üstteki satır yerine bunu kullanabilirsin:
app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html'); });

// --- RADYO YAYIN AYARLARI ---
// NOT: Buradaki bilgileri kendi Caster.fm panelindeki bilgilerle kontrol et.
const radioConfig = {
    host: 'sapircast.caster.fm',
    port: 19788,
    password: 'VrXvDZhESO', // Caster.fm şifreni tırnak içine yaz
    mount: '/miu68',
    source: 'source'
};

let streamer = null;
let users = {};
let adminCount = 0;

// Admin Bilgileri
const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

io.on('connection', (socket) => {
    
    // GİRİŞ İŞLEMİ
    socket.on('join', (data) => {
        const isAdmin = (data.nick === masterNick);
        
        if (isAdmin && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Yönetici Şifresi!');
        }

        if (isAdmin) adminCount++;

        socket.nick = data.nick || "Misafir";
        socket.role = isAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isAdmin ? '#ff4757' : '#2ecc71';

        users[socket.id] = { 
            id: socket.id, 
            nick: socket.nick, 
            role: socket.role, 
            color: socket.color 
        };

        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', { list: Object.values(users) });
    });

    // --- RADYO YAYIN KONTROLÜ ---
    
    // Yayını Başlat
    socket.on('start-broadcast', () => {
        if (socket.role === 'Yönetici') {
            try {
                console.log("Radyo bağlantısı kuruluyor...");
                streamer = new ShoutStreamer(radioConfig);
                streamer.connect();
                io.emit('chat message', { user: "SİSTEM", text: "🎙️ Canlı yayın başladı!", color: "#f1c40f" });
            } catch (err) {
                console.error("Radyo bağlantı hatası:", err);
            }
        }
    });

    // Ses Verisini Al ve Radyoya Gönder
    socket.on('audio-data', (data) => {
        if (streamer && socket.role === 'Yönetici') {
            // Tarayıcıdan gelen Float32 array verisini Buffer'a çevirip basıyoruz
            streamer.write(Buffer.from(data));
        }
    });

    // Yayını Durdur
    socket.on('stop-broadcast', () => {
        if (streamer && socket.role === 'Yönetici') {
            streamer.destroy();
            streamer = null;
            io.emit('chat message', { user: "SİSTEM", text: "🛑 Yayın sona erdi.", color: "#e74c3c" });
        }
    });

    // MESAJLAŞMA SİSTEMİ
    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            const msgData = { 
                user: u.nick, 
                text: data.text, 
                color: data.color || u.color,
                style: data.style 
            };

            // Özel Mesaj Kontrolü (Yönetici için)
            if (data.targetId && u.role === 'Yönetici') {
                socket.emit('chat message', { ...msgData, user: `(Özel -> ${data.targetNick}) ${u.nick}` });
                io.to(data.targetId).emit('chat message', { ...msgData, user: u.nick });
            } else {
                io.emit('chat message', msgData);
            }
        }
    });

    // KULLANICI AYRILDIĞINDA
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            if (users[socket.id].role === 'Yönetici') adminCount--;
            delete users[socket.id];
            io.emit('user list', { list: Object.values(users) });
        }
    });
});

// Port Ayarı
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
