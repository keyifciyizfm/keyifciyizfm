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

function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f60a.svg",
        ":joy:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f602.svg",
        ":heart:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/2764.svg",
        ":fire:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f525.svg",
        ":rose:": "https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/1f339.svg"
    };
    let newText = text;
    for (const [code, url] of Object.entries(emojiMap)) {
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:20px; height:20px; vertical-align:middle;">`);
    }
    return newText;
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if (bannedIPs.includes(socket.handshake.address)) return socket.emit('auth error', 'Engellendiniz!');
        if (data.nick === masterNick && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Şifre!');

        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'DJ' : 'Dinleyici';
        socket.color = (socket.role === 'DJ') ? '#f1c40f' : '#2ecc71';
        
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            io.emit('chat message', { 
                user: users[socket.id].nick, 
                role: users[socket.id].role,
                text: parseEmojis(data.text), 
                color: data.color || users[socket.id].color, 
                style: data.style 
            });
        }
    });

    socket.on('disconnect', () => { delete users[socket.id]; io.emit('user list', Object.values(users)); });
});

server.listen(process.env.PORT || 3000);
