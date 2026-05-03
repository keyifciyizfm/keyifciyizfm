const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 

// YÖNETİCİ AYARLARI
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
    socket.on('join', (data) => {
        if (data.nick === masterNick && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Şifre!');
        }

        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'DJ' : 'Dinleyici';
        socket.color = (socket.role === 'DJ') ? '#f1c40f' : (data.color || "#2ecc71");
        socket.isMuted = false;
        
        users[socket.id] = { id: socket.id, nick: socket.nick, color: socket.color, role: socket.role };
        
        socket.emit('login success', { role: socket.role });
        io.emit('user list', Object.values(users));
        io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} bağlandı!`, system: true });
    });

    socket.on('chat message', (data) => {
        if (socket.isMuted) return socket.emit('chat message', { user: 'SİSTEM', text: 'Susturuldunuz!', system: true });
        
        const cleanText = parseEmojis(data.text); 
        io.emit('chat message', { 
            user: socket.nick, 
            text: cleanText, 
            color: socket.color, 
            style: data.style 
        });
    });

    socket.on('admin-action', (data) => {
        if (socket.role !== 'DJ') return;
        const target = io.sockets.sockets.get(data.targetId);
        if (!target) return;

        if (data.action === 'kick') target.disconnect();
        if (data.action === 'mute') {
            target.isMuted = !target.isMuted;
            target.emit('chat message', { user: 'SİSTEM', text: target.isMuted ? 'Susturuldunuz.' : 'Konuşabilirsiniz.', system: true });
        }
        if (data.action === 'op') {
            users[data.targetId].role = 'Operatör';
            users[data.targetId].color = '#3498db';
            target.color = '#3498db';
            io.emit('user list', Object.values(users));
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const nick = users[socket.id].nick;
            delete users[socket.id];
            io.emit('user list', Object.values(users));
            io.emit('chat message', { user: 'SİSTEM', text: `${nick} ayrıldı.`, system: true });
        }
    });
});

server.listen(3000, () => console.log(`Sohbet Yayında!`));
