const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();

// Güvenlik: Iframe (Player) sorunsuz çalışması için
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "frame-src *;");
    next();
});

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let userStatus = {}; 
let currentBackground = ""; 
let adminCount = 0; 
let shutdownTimer = null; 

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456"; // Burayı kendi şifrenle değiştirebilirsin

function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "1f604", ":joy:": "1f602", ":kiss:": "1f618", ":heart:": "2764",
        ":fire:": "1f525", ":rose:": "1f339", ":thumbsup:": "1f44d", ":microphone:": "1f399"
    };
    let newText = text;
    for (const [code, id] of Object.entries(emojiMap)) {
        const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.webp`;
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:20px; height:20px; vertical-align:middle;">`);
    }
    return newText;
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isTargetAdmin = (data.nick === masterNick);
        
        if (adminCount === 0 && !isTargetAdmin) {
            return socket.emit('auth error', 'Yayıncı şu an yayında değil!');
        }
        if (isTargetAdmin && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Şifre!');
        }

        if (isTargetAdmin) {
            adminCount++;
            if (shutdownTimer) { clearTimeout(shutdownTimer); shutdownTimer = null; }
        }

        socket.nick = data.nick;
        socket.role = isTargetAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isTargetAdmin ? '#ff4757' : '#2ecc71';
        
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, status: 0 };
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        io.emit('user list', { list: Object.values(users) });
    });

    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            io.emit('chat message', { 
                user: users[socket.id].nick, 
                text: parseEmojis(data.text), 
                color: data.color, 
                style: data.style 
            });
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            if (users[socket.id].role === 'Yönetici') {
                adminCount--;
                if (adminCount <= 0) {
                    shutdownTimer = setTimeout(() => { io.emit('force logout'); users = {}; }, 60000);
                }
            }
            delete users[socket.id];
            io.emit('user list', { list: Object.values(users) });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sistem ${PORT} portunda hazır.`));
