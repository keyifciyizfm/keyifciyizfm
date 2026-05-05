const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8, // 100MB Dosya Desteği
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let userStatus = {}; 
let currentBackground = ""; 
let adminCount = 0; 
let shutdownTimer = null; 

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

// EMOJİ PARSER (Senin Orijinal Kodun)
function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "1f604", ":joy:": "1f602", ":kiss:": "1f618", ":heart:": "2764",
        ":fire:": "1f525", ":rose:": "1f339", ":thumbsup:": "1f44d", ":microphone:": "1f399",
        ":wink:": "1f609", ":star:": "2b50", ":coffee:": "2615", ":musical_note:": "1f3b5"
    };
    let newText = text;
    for (const [code, id] of Object.entries(emojiMap)) {
        const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.webp`;
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:22px; height:22px; vertical-align:middle; margin:0 2px;">`);
    }
    return newText;
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isTargetAdmin = (data.nick === masterNick);
        if (adminCount === 0 && !isTargetAdmin) return socket.emit('auth error', 'Yayıncı şu an yayında değil!');
        if (isTargetAdmin && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Şifre!');
        
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
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    // SES AKTARIMI (Kritik Nokta)
    socket.on('audio-packet', (data) => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('audio-stream', data);
        }
    });

    // ... (Chat, Ban, Color Diğer Eventler)
    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            io.emit('chat message', { user: u.nick, text: parseEmojis(data.text), color: data.color || u.color, style: data.style });
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id] && users[socket.id].role === 'Yönetici') {
            adminCount--;
            if (adminCount <= 0) {
                shutdownTimer = setTimeout(() => { io.emit('force logout'); users = {}; adminCount = 0; }, 60000);
            }
        }
        delete users[socket.id];
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });
});

server.listen(3000, () => console.log("Radyo ve Sohbet Hazır!"));
