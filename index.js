const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { ShoutStreamer } = require('shoutstreamer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// --- AYARLAR ---
const RADIO_CONFIG = {
    host: 'sapircast.caster.fm',
    port: 19788,
    password: 'YAYIN_SIFRENIZ', // Burayı Caster.fm şifrenle değiştir
    mount: '/stream',
    source: 'source'
};

const MASTER_NICK = "Keyifciyiz_Fm";
const MASTER_PASS = "123456"; // Yönetici giriş şifresi

let streamer = null;
let activeUsers = {};

io.on('connection', (socket) => {
    
    // GİRİŞ
    socket.on('join', (data) => {
        const isAdmin = (data.nick === MASTER_NICK);
        if (isAdmin && data.password !== MASTER_PASS) {
            return socket.emit('chat message', { user: 'SİSTEM', text: 'Hatalı şifre!', color: 'red' });
        }

        socket.nick = data.nick || "Misafir";
        socket.role = isAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isAdmin ? '#ff4757' : '#2ecc71';
        
        activeUsers[socket.id] = { nick: socket.nick, role: socket.role };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
    });

    // RADYO YAYIN MOTORU
    socket.on('start-broadcast', () => {
        if (socket.nick === MASTER_NICK && !streamer) {
            console.log("Radyo yayını başlatılıyor...");
            streamer = new ShoutStreamer(RADIO_CONFIG);
            streamer.connect();
        }
    });

    socket.on('audio-data', (data) => {
        if (streamer && socket.nick === MASTER_NICK) {
            // Tarayıcıdan gelen ham ses verisini (ArrayBuffer) Buffer'a çevirip basıyoruz
            streamer.write(Buffer.from(data));
        }
    });

    socket.on('stop-broadcast', () => {
        if (streamer) {
            streamer.destroy();
            streamer = null;
            console.log("Yayın durduruldu.");
        }
    });

    // CHAT
    socket.on('chat message', (msg) => {
        if (activeUsers[socket.id]) {
            io.emit('chat message', {
                user: activeUsers[socket.id].nick,
                text: msg.text,
                color: socket.color
            });
        }
    });

    socket.on('disconnect', () => { delete activeUsers[socket.id]; });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
