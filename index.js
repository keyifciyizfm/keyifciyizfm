const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let userStatus = {}; // { 'Nick': DurumKodu (0:Normal, 1:Susturuldu, 2:Engellendi) }
const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

// Emoji Çözücü Fonksiyon
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

    socket.on('join', (data) => {
        if (data.nick === masterNick && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Şifre!');
        
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        if (userStatus[socket.nick] === undefined) userStatus[socket.nick] = 0;

        users[socket.id] = { 
            id: socket.id, nick: socket.nick, role: socket.role, 
            color: socket.color, status: userStatus[socket.nick] 
        };

        socket.emit('login success', { role: socket.role, nick: socket.nick });
        socket.emit('status update', userStatus[socket.nick]);
        io.emit('user list', Object.values(users));
    });

    // Durum Güncelleme (Mavi/Kırmızı Kutu)
    socket.on('update status', (data) => {
        if (socket.role !== 'Yönetici') return;
        userStatus[data.target] = data.state;
        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target) {
                users[id].status = data.state;
                io.to(id).emit('status update', data.state);
            }
        });
        io.emit('user list', Object.values(users));
    });

    // Renk Güncelleme
    socket.on('update color', (newColor) => {
        if (users[socket.id]) {
            users[socket.id].color = newColor;
            io.emit('user list', Object.values(users));
        }
    });

    // Sohbet Temizleme (Yönetici Özel)
    socket.on('clear chat', () => {
        if (socket.role === 'Yönetici') {
            io.emit('chat cleared');
        }
    });

    // Mesajlaşma
    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            if (userStatus[u.nick] === 2) return; // Engelli ise engelle

            const msgData = { 
                user: u.nick, 
                text: parseEmojis(data.text), 
                color: data.color || u.color, 
                style: data.style 
            };

            if (userStatus[u.nick] === 1) { // Susturulmuş ise
                msgData.isMuted = true;
                socket.emit('chat message', msgData); // Kendine gönder
                Object.keys(users).forEach(id => {
                    if (users[id].role === 'Yönetici' && id !== socket.id) io.to(id).emit('chat message', msgData);
                });
            } else {
                io.emit('chat message', msgData);
            }
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) { delete users[socket.id]; io.emit('user list', Object.values(users)); }
    });
});

server.listen(process.env.PORT || 3000, () => console.log('Sunucu 3000 portunda aktif.'));
