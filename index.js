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
// Kullanıcıların durumlarını (0, 1, 2) saklayacağımız nesne
let userStatus = {}; 

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

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
    const userIP = socket.handshake.address;

    socket.on('join', (data) => {
        if (bannedIPs.includes(userIP)) return socket.emit('auth error', 'Girişiniz engellendi!');
        if (data.nick === masterNick && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Şifre!');
        
        socket.nick = data.nick || "Misafir";
        socket.role = (data.nick === masterNick) ? 'Yönetici' : 'Dinleyici';
        socket.color = (socket.role === 'Yönetici') ? '#ff4757' : '#2ecc71';
        
        // Kullanıcı bağlandığında durumu varsayılan olarak 0 (Normal) yap
        if (!userStatus[socket.nick]) userStatus[socket.nick] = 0;

        users[socket.id] = { 
            id: socket.id, 
            nick: socket.nick, 
            role: socket.role, 
            color: socket.color, 
            ip: userIP,
            status: userStatus[socket.nick] // Mevcut durumu ekle
        };

        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', Object.values(users));
    });

    // --- YENİ: YÖNETİCİDEN GELEN DURUM GÜNCELLEMESİ ---
    socket.on('update status', (data) => {
        if (socket.role !== 'Yönetici') return;
        
        // Hedef kullanıcının durumunu güncelle (0, 1 veya 2)
        userStatus[data.target] = data.state;

        // Tüm bağlı kullanıcıların listesindeki o kişiyi güncelle
        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target) {
                users[id].status = data.state;
            }
        });

        // Herkese yeni listeyi gönder (Kutucukların anında renk değiştirmesi için)
        io.emit('user list', Object.values(users));
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            const state = userStatus[u.nick] || 0;

            // 🚫 DURUM 2 ise (Engelli): Mesajı hiçbir yere gönderme, çöpe at.
            if (state === 2) return;

            // 🤫 DURUM 1 ise (Susturuldu):
            if (state === 1) {
                // Mesajı sadece gönderen kişiye ve Yöneticiye gönder
                const msgData = { 
                    user: u.nick, 
                    text: parseEmojis(data.text), 
                    color: data.color || u.color, 
                    style: data.style,
                    isMuted: true // Mesajın susturulmuş olduğunu belirt
                };
                
                socket.emit('chat message', msgData); // Kendisine gönder
                // Yöneticiyi bul ve ona da gönder
                Object.keys(users).forEach(id => {
                    if (users[id].role === 'Yönetici' && id !== socket.id) {
                        io.to(id).emit('chat message', msgData);
                    }
                });
            } else {
                // ✅ DURUM 0 ise (Normal): Mesajı herkese gönder
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
        if (users[socket.id]) { 
            delete users[socket.id]; 
            io.emit('user list', Object.values(users)); 
        }
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Sunucu 3000 portunda aktif.");
});
