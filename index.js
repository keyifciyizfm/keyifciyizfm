const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 

// Emoji kodlarını görsele çeviren fonksiyon
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
        socket.nick = data.nick || "Misafir";
        socket.color = "#2ecc71";
        users[socket.id] = { nick: socket.nick, color: socket.color };
        
        io.emit('user list', Object.values(users));
        io.emit('chat message', { user: 'SİSTEM', text: `${socket.nick} bağlandı!`, system: true });
    });

    socket.on('change color', (newColor) => {
        if (users[socket.id]) {
            users[socket.id].color = newColor;
            socket.color = newColor;
            io.emit('user list', Object.values(users));
        }
    });

    socket.on('chat message', (data) => {
        // Gelen metni sunucuda emojilere çevirip geri gönderiyoruz
        const cleanText = parseEmojis(data.text); 
        io.emit('chat message', { 
            user: socket.nick, 
            text: cleanText, 
            color: socket.color, 
            style: data.style 
        });
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Radyo Yayında!`));
