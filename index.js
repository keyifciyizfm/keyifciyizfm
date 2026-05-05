const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let userStatus = {}; 
let currentBackground = ""; // Arka plan hafızası
const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

// Emoji dönüştürücü fonksiyonu
function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "1f60a", ":joy:": "1f602", ":cool:": "1f60e", ":heart:": "2764",
        ":fire:": "1f525", ":rose:": "1f339", ":thumbsup:": "1f44d", ":microphone:": "1f399",
        ":wink:": "1f609", ":star:": "2b50", ":coffee:": "2615", ":musical_note:": "1f3b5"
    };
    let newText = text;
    for (const [code, id] of Object.entries(emojiMap)) {
        const url = `https://cdn.jsdelivr.net/gh/jakejarvis/apple-emoji-svg@master/emoji/${id}.svg`;
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:22px; height:22px; vertical-align:middle; margin:0 2px;">`);
    }
    return newText;
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if (data.nick === masterNick && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Yönetici Şifresi!');
        }
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        if (userStatus[socket.nick] === undefined) userStatus[socket.nick] = 0;
        
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, status: userStatus[socket.nick] };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        socket.emit('status update', userStatus[socket.nick]);
        
        // Yeni gelene arka planı gönder
        if (currentBackground !== "") socket.emit('background changed', currentBackground);
        
        io.emit('user list', Object.values(users));
    });

    socket.on('update status', (data) => {
        if (socket.role !== 'Yönetici') return;
        userStatus[data.target] = data.state;
        
        let statusMsg = "";
        if(data.state === 1) statusMsg = "🔇 [" + data.target + "] Susturuldunuz!";
        if(data.state === 2) statusMsg = "🚫 [" + data.target + "] Engellendiniz!";
        if(data.state === 0) statusMsg = "✅ [" + data.target + "] Engeliniz Kaldırıldı!";

        // Gizli Bildirim: Sadece yöneticiye ve hedefe gönder
        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target || users[id].role === 'Yönetici') {
                io.to(id).emit('chat message', { 
                    user: "BİLGİ", 
                    text: statusMsg, 
                    color: "#f1c40f", 
                    style: { bold: true, italic: true } 
                });
            }
            if (users[id].nick === data.target) {
                users[id].status = data.state;
                io.to(id).emit('status update', data.state);
            }
        });
        io.emit('user list', Object.values(users));
    });

    socket.on('change background', (url) => { 
        if (socket.role === 'Yönetici') {
            currentBackground = url;
            io.emit('background changed', url);
        }
    });

    socket.on('update color', (newColor) => {
        if (users[socket.id]) { users[socket.id].color = newColor; io.emit('user list', Object.values(users)); }
    });

    socket.on('clear chat', () => { if (socket.role === 'Yönetici') io.emit('chat cleared'); });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            if (userStatus[u.nick] === 2) return;
            
            const msgData = { 
                user: u.nick, 
                text: parseEmojis(data.text), 
                color: data.color || u.color, 
                style: data.style 
            };

            if (userStatus[u.nick] === 1) {
                msgData.isMuted = true;
                socket.emit('chat message', msgData); // Kendine
                Object.keys(users).forEach(id => { 
                    if (users[id].role === 'Yönetici' && id !== socket.id) io.to(id).emit('chat message', msgData); // Yöneticiye
                });
            } else {
                io.emit('chat message', msgData); // Herkese
            }
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) { delete users[socket.id]; io.emit('user list', Object.values(users)); }
    });
});

server.listen(process.env.PORT || 3000);
