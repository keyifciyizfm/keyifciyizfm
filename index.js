const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    // Ses verisi (binary) transferi için paket boyutunu biraz geniş tutalım
    maxHttpBufferSize: 1e7 
});

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let bannedIPs = [];
let isLive = false; // Yayın durumu takibi

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "1f60a", ":joy:": "1f602", ":cool:": "1f60e", ":heart:": "2764",
        ":fire:": "1f525", ":rose:": "1f339", ":thumbsup:": "1f44d", ":microphone:": "1f399",
        ":wink:": "1f609", ":star:": "2b50", ":coffee:": "2615", ":musical_note:": "1f3b5"
    };
    let newText = text;
    for (const [code, id] of Object.entries(emojiMap)) {
        const url = `https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/${id}.svg`;
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:22px; height:22px; vertical-align:middle; margin:0 2px;">`);
    }
    return newText;
}

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;

    socket.on('join', (data) => {
        if (bannedIPs.includes(userIP)) return socket.emit('auth error', 'Girişiniz engellendi!');
        if (data.nick === masterNick && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Şifre!');
        
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, ip: userIP };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        
        // Eğer o an yayın varsa yeni bağlanana "Yayın Başladı" bilgisini gönder
        if(isLive) {
            socket.emit('broadcast-started');
        }

        io.emit('user list', Object.values(users));
    });

    // --- SES YAYINI KODLARI ---

    // DJ Yayını başlattığında
    socket.on('start-broadcast', () => {
        if (socket.role === 'Yönetici') {
            isLive = true;
            socket.broadcast.emit('broadcast-started'); // Diğer herkese bildir
            console.log("DJ Yayına Başladı");
        }
    });

    // DJ'den gelen ses paketlerini (audio chunk) dinleyicilere aktar
    socket.on('audio-data', (blob) => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('audio-stream', blob);
        }
    });

    // DJ Yayını durdurduğunda
    socket.on('stop-broadcast', () => {
        if (socket.role === 'Yönetici') {
            isLive = false;
            socket.broadcast.emit('broadcast-stopped');
            console.log("DJ Yayını Durdurdu");
        }
    });

    // --- ADMİN VE CHAT KODLARI ---

    socket.on('admin command', (data) => {
        if (socket.role !== 'Yönetici') return;
        const targetId = Object.keys(users).find(id => users[id].nick === data.targetNick);
        if (!targetId) return;
        if (data.action === 'kick') {
            io.to(targetId).emit('force logout', 'Odadan atıldınız!');
            io.sockets.sockets.get(targetId)?.disconnect();
        } else if (data.action === 'ban') {
            bannedIPs.push(users[targetId].ip);
            io.to(targetId).emit('force logout', 'Banlandınız!');
            io.sockets.sockets.get(targetId)?.disconnect();
        }
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            io.emit('chat message', { 
                user: u.nick, 
                text: parseEmojis(data.text), 
                color: data.color || u.color, 
                style: data.style 
            });
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) { 
            // Eğer yayıncı koparsa yayını durdurulmuş say
            if(users[socket.id].nick === masterNick) isLive = false;
            delete users[socket.id]; 
            io.emit('user list', Object.values(users)); 
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});
