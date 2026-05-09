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
let shutdownTimer = null; // 60 saniye kuralı için değişken

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
        
        // KRİTİK: Yönetici devretme/bekleme süresi içindeysek dinleyici girebilir
        // Ancak süre dolmuşsa veya hiç yönetici girmemişse engel olur
        if (adminCount === 0 && !isTargetAdmin && !shutdownTimer) {
            return socket.emit('auth error', 'Yayıncı şu an yayında değil!');
        }
        
        if (isTargetAdmin && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Şifre!');
        }
        
        if (isTargetAdmin) {
            adminCount++;
            // YÖNETİCİ GELDİ: Varsa geri sayımı durdur
            if (shutdownTimer) { 
                clearTimeout(shutdownTimer); 
                shutdownTimer = null; 
                console.log("Yönetici devraldı, kapanma iptal edildi.");
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

    socket.on('update color', (newColor) => {
        if (users[socket.id]) {
            users[socket.id].color = newColor;
            socket.color = newColor;
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

        if (data.target && u.role === 'Yönetici') {
            const targetSocket = Object.values(users).find(usr => usr.nick === data.target);
            if (targetSocket) {
                socket.emit('chat message', msgData); 
                io.to(targetSocket.id).emit('chat message', msgData);
            }
            return;
        }

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
        userStatus[data.target] = data.state;
        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target) {
                users[id].status = data.state;
                if (data.state === 1) {
                    io.to(id).emit('chat message', { user: "BİLGİ", text: "⚠️ Susturuldunuz!", color: "#f1c40f", style: { bold: true } });
                } else if (oldStatus === 1 && data.state === 0) {
                    io.to(id).emit('chat message', { user: "BİLGİ", text: "✅ Sohbete devam edebilirsiniz!", color: "#2ecc71", style: { bold: true } });
                }
                io.to(id).emit('status update', data.state);
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
                // 60 SANİYE KURALI BURADA (Yönetici çıkınca başlar)
                if (adminCount <= 0) {
                    console.log("Son yönetici ayrıldı. 60 saniyelik devretme süresi başladı.");
                    shutdownTimer = setTimeout(() => { 
                        io.emit('force logout'); 
                        users = {}; 
                        adminCount = 0; 
                        currentBackground = "";
                        shutdownTimer = null;
                        console.log("Süre doldu, oda kapatıldı.");
                    }, 60000);
                }
            }
            delete users[socket.id];
            io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
        }
    });
});

server.listen(3000);
