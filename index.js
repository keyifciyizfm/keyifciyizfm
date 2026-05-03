const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let bannedIPs = [];

// YÖNETİCİ BİLGİLERİ
const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f60a.svg",
        ":joy:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f602.svg",
        ":heart:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/2764.svg",
        ":fire:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f525.svg",
        ":microphone:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f399.svg",
        ":cool:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f60e.svg",
        ":thumbsup:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f44d.svg",
        ":rose:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f339.svg"
    };
    let newText = text;
    for (const [code, url] of Object.entries(emojiMap)) {
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:20px; height:20px; vertical-align:middle; margin:0 2px;">`);
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
        io.emit('user list', Object.values(users));
    });

    socket.on('admin command', (data) => {
        if (socket.role !== 'Yönetici' && socket.role !== 'Admin') return;
        const targetId = Object.keys(users).find(id => users[id].nick === data.targetNick);
        if (!targetId) return;

        if (data.action === 'kick') {
            io.to(targetId).emit('force logout', 'Odadan atıldınız!');
            io.sockets.sockets.get(targetId)?.disconnect();
        } else if (data.action === 'ban') {
            bannedIPs.push(users[targetId].ip);
            io.to(targetId).emit('force logout', 'Banlandınız!');
            io.sockets.sockets.get(targetId)?.disconnect();
        } else if (data.action === 'make_dj') {
            users[targetId].role = 'DJ';
            const tSock = io.sockets.sockets.get(targetId);
            if(tSock) tSock.role = 'DJ';
            io.emit('user list', Object.values(users));
        }
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            const cleanText = parseEmojis(data.text);
            io.emit('chat message', { 
                user: u.nick, 
                role: u.role,
                text: cleanText, 
                color: data.color || u.color, 
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

server.listen(process.env.PORT || 3000, () => {
    console.log("Sunucu 3000 portunda aktif!");
});
