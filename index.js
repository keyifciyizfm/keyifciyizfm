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
const masterPass = "123456"; // Kendi şifrenle değiştirebilirsin

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
        
        if (adminCount === 0 && !isTargetAdmin) {
            return socket.emit('auth error', 'Yayıncı şu an yayında değil, oda kapalı!');
        }
        
        if (isTargetAdmin && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Yönetici Şifresi!');
        }
        
        if (isTargetAdmin) {
            adminCount++;
            if (shutdownTimer) {
                clearTimeout(shutdownTimer);
                shutdownTimer = null;
                io.emit('chat message', { user: "SİSTEM", text: "🎧 Yeni yayıncı bağlandı, yayın devralındı.", color: "#2ecc71" });
            }
        }
        
        socket.nick = data.nick || "Misafir";
        socket.role = isTargetAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isTargetAdmin ? (data.color || '#ff4757') : '#2ecc71';
        
        if (userStatus[socket.nick] === undefined) userStatus[socket.nick] = 0;
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, status: userStatus[socket.nick] };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        socket.emit('status update', userStatus[socket.nick]);
        if (currentBackground !== "") socket.emit('background changed', currentBackground);
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    socket.on('update status', (data) => {
        if (socket.role !== 'Yönetici') return;
        userStatus[data.target] = data.state;
        
        let statusMsg = (data.state === 1) ? `🔇 Susturuldunuz!` : (data.state === 0 ? `✅ Sohbete devam edebilirsiniz.` : "");
        
        Object.keys(users).forEach(id => {
            if (users[id].nick === data.target) {
                if(statusMsg !== "") {
                    io.to(id).emit('chat message', { user: "BİLGİ", text: statusMsg, color: "#f1c40f", style: { bold: true, italic: true } });
                }
                users[id].status = data.state;
                io.to(id).emit('status update', data.state);
            }
        });
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            if (userStatus[u.nick] === 2) return;
            const msgData = { user: u.nick, text: parseEmojis(data.text), color: data.color || u.color, style: data.style, isMuted: (userStatus[u.nick] === 1) };
            if (userStatus[u.nick] === 1) {
                socket.emit('chat message', msgData);
                Object.keys(users).forEach(id => { 
                    if (users[id].role === 'Yönetici' && id !== socket.id) io.to(id).emit('chat message', { ...msgData, user: u.nick + " (Susturuldu)" });
                });
            } else { io.emit('chat message', msgData); }
        }
    });

    socket.on('clear chat', () => { if (socket.role === 'Yönetici') io.emit('chat cleared'); });
    socket.on('change background', (url) => { if (socket.role === 'Yönetici') { currentBackground = url; io.emit('background changed', url); } });
    
    socket.on('update color', (newColor) => { 
        if (users[socket.id]) { 
            users[socket.id].color = newColor; 
            io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) }); 
        } 
    });
    
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            if (users[socket.id].role === 'Yönetici') {
                adminCount--;
                if (adminCount <= 0) {
                    adminCount = 0;
                    io.emit('chat message', { user: "BİLGİ", text: "⚠️ Yayıncı değişikliği yapılıyor, oda 60 saniye içinde devredilecek...", color: "#f1c40f" });
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

server.listen(process.env.PORT || 3000);
