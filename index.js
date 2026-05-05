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
let userStatus = {}; // { 'Nick': DurumKodu }

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "1f60a", ":joy:": "1f602", ":cool:": "1f60e", ":heart:": "2764",
        ":fire:": "1f525", ":rose:": "1f339", ":thumbsup:": "1f44d", ":microphone:": "1f399"
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
        
        if (userStatus[socket.nick] === undefined) userStatus[socket.nick] = 0;

        // Eğer kullanıcı zaten engelliyse (durum 2), daha girmeden engelle
        if (userStatus[socket.nick] === 2) {
            return socket.emit('user banned', 'Engellendiğiniz için giriş yapamazsınız!');
        }

        users[socket.id] = { 
            id: socket.id, 
            nick: socket.nick, 
            role: socket.role, 
            color: socket.color, 
            status: userStatus[socket.nick] 
        };

        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
    });

    socket.on('update status', (data) => {
        if (socket.role !== 'Yönetici') return;
        
        userStatus[data.target] = data.state;

        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target) {
                users[id].status = data.state;
                
                // Durum 2 (Kırmızı) olduğunda kullanıcıyı anında kov ve ekranını kapat
                if (data.state === 2) {
                    io.to(id).emit('user banned', 'Yönetici tarafından engellendiniz!');
                }
            }
        });

        io.emit('user list', Object.values(users));
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            const state = userStatus[u.nick] || 0;

            if (state === 2) return; // Engelli ise mesaj gitmez

            if (state === 1) { // Susturulmuş
                const msg = { user: u.nick, text: parseEmojis(data.text), color: data.color || u.color, isMuted: true };
                socket.emit('chat message', msg);
                Object.keys(users).forEach(id => {
                    if (users[id].role === 'Yönetici' && id !== socket.id) io.to(id).emit('chat message', msg);
                });
            } else {
                io.emit('chat message', { user: u.nick, text: parseEmojis(data.text), color: data.color || u.color });
            }
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) { delete users[socket.id]; io.emit('user list', Object.values(users)); }
    });
});

server.listen(process.env.PORT || 3000);
