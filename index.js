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
// Kullanıcı durumlarını hafızada tutmak için (0: Normal, 1: Mavi/, 2: Kırmızı-)
let userStatus = {}; 

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
        
        // Eğer kullanıcının daha önceden bir durumu yoksa 0 (Normal) ata
        if (userStatus[socket.nick] === undefined) {
            userStatus[socket.nick] = 0;
        }

        users[socket.id] = { 
            id: socket.id, 
            nick: socket.nick, 
            role: socket.role, 
            color: socket.color, 
            ip: userIP,
            status: userStatus[socket.nick] // Durumu kullanıcı verisine ekle
        };

        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
    });

    // --- KRİTİK: KUTUCUĞA TIKLANDIĞINDA ÇALIŞAN KISIM ---
    socket.on('update status', (data) => {
        if (socket.role !== 'Yönetici') return;
        
        // Sunucu hafızasındaki durumu güncelle
        userStatus[data.target] = data.state;

        // Bağlı olan tüm kullanıcılarda bu nicke sahip olanın durumunu güncelle
        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target) {
                users[id].status = data.state;
            }
        });

        // Herkese güncel kullanıcı listesini gönder (Kutucukların anında renk değiştirmesi için)
        io.emit('user list', Object.values(users));
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            const currentS = userStatus[u.nick] || 0;

            // DURUM 2: Kırmızı (-) ise hiçbir mesajı gönderme
            if (currentS === 2) return;

            // DURUM 1: Mavi (/) ise sadece yazan ve yönetici görsün
            if (currentS === 1) {
                const mutedData = { 
                    user: u.nick, 
                    text: parseEmojis(data.text), 
                    color: data.color || u.color, 
                    style: data.style,
                    isMuted: true 
                };
                
                // Kendine gönder
                socket.emit('chat message', mutedData);
                
                // Yöneticiye gönder
                Object.keys(users).forEach(id => {
                    if (users[id].role === 'Yönetici' && id !== socket.id) {
                        io.to(id).emit('chat message', mutedData);
                    }
                });
            } else {
                // DURUM 0: Normal ise herkese gönder
                io.emit('chat message', { 
                    user: u.nick, 
                    text: parseEmojis(data.text), 
                    color: data.color || u.color, 
                    style: data.style 
                });
            }
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) { delete users[socket.id]; io.emit('user list', Object.values(users)); }
    });
});

server.listen(process.env.PORT || 3000);
