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
let shutdownTimer = null; 

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "1f604", ":joy:": "1f602", ":kiss:": "1f618", ":heart:": "2764",
        ":fire:": "1f525", ":rose:": "1f339", ":thumbsup:": "1f44d", ":microphone:": "1f399",
        ":wink:": "1f609", ":star:": "2b50", ":coffee:": "2615", ":musical_note:": "1f3b5"
    };
    let newText = text;
    for (const [code, id] of Object.entries(emojiMap)) {
        const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.webp`;
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:22px; height:22px; vertical-align:middle; margin:0 2px;">`);
    }
    return newText;
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isTargetAdmin = (data.nick === masterNick);
        
        // Yönetici yoksa ve giren kişi yönetici değilse reddet
        if (adminCount === 0 && !isTargetAdmin) return socket.emit('auth error', 'Yayıncı şu an yayında değil!');
        if (isTargetAdmin && data.password !== masterPass) return socket.emit('auth error', 'Hatalı Şifre!');
        
        // Yönetici girerse 60 saniye kuralını durdur
        if (isTargetAdmin) {
            adminCount++;
            if (shutdownTimer) { 
                clearTimeout(shutdownTimer); 
                shutdownTimer = null; 
            }
        }
        
        socket.nick = data.nick;
        socket.role = isTargetAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isTargetAdmin ? '#ff4757' : '#2ecc71';
        
        if (userStatus[socket.nick] === undefined) userStatus[socket.nick] = 0;
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, status: userStatus[socket.nick] };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        socket.emit('status update', userStatus[socket.nick]);
        if (currentBackground !== "") socket.emit('background changed', currentBackground);
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    // RENK GÜNCELLEME SİSTEMİ (Kesin Çözüm)
    socket.on('update color', (newColor) => {
        if (users[socket.id]) {
            users[socket.id].color = newColor;
            socket.color = newColor;
            // Listeyi herkese gönder ki ismin rengi değişsin
            io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
        }
    });

    socket.on('chat message', (data) => {
        const u = users[socket.id];
        if (!u) return;
        const currentStatus = userStatus[u.nick] || 0;
        if (currentStatus === 2) return;

        const msgData = { 
            user: u.nick, 
            text: parseEmojis(data.text), 
            color: data.color || u.color, 
            style: data.style,
            target: data.target 
        };

        // Özel Mesaj (Yöneticiye gider)
        if (data.target && u.role === 'Yönetici') {
            const targetSocket = Object.values(users).find(usr => usr.nick === data.target);
            if (targetSocket) {
                socket.emit('chat message', msgData); 
                io.to(targetSocket.id).emit('chat message', msgData);
            }
            return;
        }

        // Susturulmuş Kullanıcı
        if (currentStatus === 1) {
            socket.emit('chat message', msgData);
            Object.values(users).forEach(usr => { 
                if (usr.role === 'Yönetici' && usr.id !== socket.id) {
                    io.to(usr.id).emit('chat message', { ...msgData, user: u.nick + " (Susturuldu)" });
                }
            });
        } else {
            io.emit('chat message', msgData);
        }
    });

    socket.on('update status', (data) => {
        if (socket.role !== 'Yönetici') return;
        const oldStatus = userStatus[data.target];
        const newStatus = data.state;
        userStatus[data.target] = newStatus;

        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target) {
                users[id].status = newStatus;
                
                // Susturulma Bildirimi
                if (newStatus === 1) {
                    io.to(id).emit('chat message', { user: "BİLGİ", text: "⚠️ Susturuldunuz!", color: "#f1c40f", style: { bold: true } });
                } 
                // Susturma Kaldırılma Bildirimi (DÜZELTİLDİ)
                else if (oldStatus === 1 && newStatus === 0) {
                    io.to(id).emit('chat message', { user: "BİLGİ", text: "✅ Sohbete devam edebilirsiniz!", color: "#2ecc71", style: { bold: true } });
                }
                io.to(id).emit('status update', newStatus);
            }
        });
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    socket.on('clear chat', () => { if (socket.role === 'Yönetici') io.emit('chat cleared'); });
    socket.on('change background', (url) => { if (socket.role === 'Yönetici') { currentBackground = url; io.emit('background changed', url); } });
    
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            if (users[socket.id].role === 'Yönetici') {
                adminCount--;
                // 60 SANİYE KURALI BURADA
                if (adminCount <= 0) {
                    shutdownTimer = setTimeout(() => { 
                        io.emit('force logout'); 
                        users = {}; 
                        adminCount = 0; 
                    }, 60000);
                }
            }
            delete users[socket.id];
            io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
        }
    });
});

server.listen(3000, () => console.log("Sunucu 3000 portunda aktif."));
