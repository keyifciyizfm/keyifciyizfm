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

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

// ===== STREAM SİSTEMİ =====
let listeners = [];

app.get('/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked'
    });

    listeners.push(res);

    req.on('close', () => {
        listeners = listeners.filter(l => l !== res);
    });
});

app.post('/broadcast', (req, res) => {
    req.on('data', chunk => {
        listeners.forEach(l => l.write(chunk));
    });
    req.on('end', () => res.end("ok"));
});

// =========================

function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "1f60a", ":joy:": "1f602", ":cool:": "1f60e", ":heart:": "2764",
        ":fire:": "1f525", ":rose:": "1f339", ":thumbsup:": "1f44d", ":microphone:": "1f399",
        ":wink:": "1f609", ":star:": "2b50", ":coffee:": "2615", ":musical_note:": "1f3b5"
    };
    let newText = text;
    for (const [code, id] of Object.entries(emojiMap)) {
        const url = `https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/${id}.svg`;
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:22px; height:22px;">`);
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
            delete users[socket.id];
            io.emit('user list', Object.values(users));
        }
    });
});

server.listen(process.env.PORT || 3000);
