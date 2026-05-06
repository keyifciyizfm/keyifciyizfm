const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { ShoutStreamer } = require('shoutstreamer'); // npm install shoutstreamer

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// --- RADYO VE YÖNETİCİ AYARLARI ---
const RADIO_CONFIG = {
    host: 'sapircast.caster.fm',
    port: 19788,
    password: 'YAYIN_SIFRENIZ', // Buraya Caster.fm Source Password yazın
    mount: '/stream',
    source: 'source'
};

const ADMIN_NICK = "Keyifciyiz_Fm";
const ADMIN_PASS = "123456"; // Giriş ekranındaki şifreniz

let streamer = null;
let users = {};

io.on('connection', (socket) => {
    
    // GİRİŞ İŞLEMİ
    socket.on('join', (data) => {
        const isAdmin = (data.nick === ADMIN_NICK);
        
        if (isAdmin && data.password !== ADMIN_PASS) {
            return socket.emit('auth error', 'Yönetici şifresi hatalı!');
        }

        socket.nick = data.nick;
        socket.role = isAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isAdmin ? '#ff4757' : '#2ecc71';
        
        users[socket.id] = { 
            id: socket.id, 
            nick: socket.nick, 
            role: socket.role, 
            color: socket.color,
            status: 0 
        };

        socket.emit('login success', { role: socket.role, nick: socket.nick });
        updateUserList();
    });

    // SES YAYIN MOTORU
    socket.on('start-broadcast', () => {
        if (socket.nick === ADMIN_NICK && !streamer) {
            console.log("Radyo bağlantısı kuruluyor...");
            streamer = new ShoutStreamer(RADIO_CONFIG);
            streamer.connect();
        }
    });

    socket.on('audio-data', (data) => {
        if (streamer && socket.nick === ADMIN_NICK) {
            // Tarayıcıdan gelen Float32 veriyi Buffer'a çevirip gönderir
            streamer.write(Buffer.from(data));
        }
    });

    socket.on('stop-broadcast', () => {
        if (streamer) {
            streamer.destroy();
            streamer = null;
            console.log("Radyo bağlantısı kesildi.");
        }
    });

    // MESAJLAŞMA SİSTEMİ
    socket.on('chat message', (msg) => {
        if (!users[socket.id]) return;

        const messageData = {
            user: users[socket.id].nick,
            text: msg.text,
            color: msg.color || users[socket.id].color,
            style: msg.style
        };

        // Eğer özel mesajsa (Sohbet odasındaki seçme özelliği için)
        if (msg.targetId && users[msg.targetId]) {
            io.to(msg.targetId).emit('chat message', { ...messageData, user: `Özel: ${users[socket.id].nick}` });
            socket.emit('chat message', { ...messageData, user: `${msg.targetNick} (Özel)` });
        } else {
            io.emit('chat message', messageData);
        }
    });

    // YÖNETİCİ ARAÇLARI
    socket.on('clear chat', () => {
        if (socket.role === 'Yönetici') io.emit('chat cleared');
    });

    socket.on('change background', (url) => {
        if (socket.role === 'Yönetici') io.emit('background changed', url);
    });

    socket.on('update status', (data) => {
        if (socket.role === 'Yönetici') {
            const targetSocket = Object.values(io.sockets.sockets).find(s => s.nick === data.target);
            if (targetSocket) {
                users[targetSocket.id].status = data.state;
                targetSocket.emit('status update', data.state);
                updateUserList();
            }
        }
    });

    // KULLANICI LİSTESİ GÜNCELLEME
    function updateUserList() {
        io.emit('user list', { list: Object.values(users) });
    }

    socket.on('disconnect', () => {
        delete users[socket.id];
        updateUserList();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Keyifciyiz FM ${PORT} portunda yayında...`);
});
