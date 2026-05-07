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
let currentBackground = ""; 
let adminCount = 0; 

// Yönetici Bilgileri - Burayı kendine göre düzenle
const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456"; 

function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "1f604", ":joy:": "1f602", ":kiss:": "1f618", ":heart:": "2764",
        ":fire:": "1f525", ":rose:": "1f339", ":thumbsup:": "1f44d", ":microphone:": "1f399",
        ":coffee:": "2615", ":musical_note:": "1f3b5", ":star:": "2b50"
    };
    let newText = text;
    for (const [code, id] of Object.entries(emojiMap)) {
        const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.webp`;
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:22px; height:22px; vertical-align:middle;">`);
    }
    return newText;
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isTargetAdmin = (data.nick === masterNick);
        
        if (isTargetAdmin && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Yönetici Şifresi!');
        }
        
        if (isTargetAdmin) adminCount++;
        
        socket.nick = data.nick || "Misafir";
        socket.role = isTargetAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isTargetAdmin ? '#ff4757' : '#2ecc71';
        
        if (userStatus[socket.nick] === undefined) userStatus[socket.nick] = 0;
        
        users[socket.id] = { 
            id: socket.id, 
            nick: socket.nick, 
            role: socket.role, 
            color: socket.color, 
            status: userStatus[socket.nick] 
        };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        socket.emit('status update', userStatus[socket.nick]);
        if (currentBackground !== "") socket.emit('background changed', currentBackground);
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    socket.on('chat message', (data) => {
        const u = users[socket.id];
        if (!u || u.status === 2) return;

        const msgData = { 
            user: u.nick, 
            text: parseEmojis(data.text), 
            color: data.color || u.color, 
            style: data.style 
        };

        if (data.targetId && u.role === 'Yönetici') {
            socket.emit('chat message', { ...msgData, user: `Fisilti -> ${data.targetNick}` });
            io.to(data.targetId).emit('chat message', { ...msgData, user: `${u.nick} (Özel)` });
            return;
        }

        if (u.status === 1) {
            socket.emit('chat message', msgData);
            Object.keys(users).forEach(id => {
                if (users[id].role === 'Yönetici' && id !== socket.id) {
                    io.to(id).emit('chat message', { ...msgData, user: u.nick + " (Susturuldu)" });
                }
            });
        } else {
            io.emit('chat message', msgData);
        }
    });

    socket.on('update status', (data) => {
        if (socket.role !== 'Yönetici') return;
        userStatus[data.target] = data.state;
        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target) {
                users[id].status = data.state;
                io.to(id).emit('status update', data.state);
            }
        });
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    socket.on('clear chat', () => { if (socket.role === 'Yönetici') io.emit('chat cleared'); });
    socket.on('change background', (url) => { if (socket.role === 'Yönetici') { currentBackground = url; io.emit('background changed', url); } });
    socket.on('update color', (c) => { if (users[socket.id]) { users[socket.id].color = c; io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) }); } });
    
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            if (users[socket.id].role === 'Yönetici') adminCount--;
            delete users[socket.id];
            io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
        }
    });
});

server.listen(3000, () => console.log('Sunucu hazır.'));
