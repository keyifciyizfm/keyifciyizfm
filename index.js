const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statik dosyaları public klasöründen servis et
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    // Bağlanan kişiye 100-999 arası rastgele numara ver
    const randomId = Math.floor(Math.random() * 899) + 100;
    const userName = "Misafir-" + randomId;

    console.log(`${userName} bağlandı.`);

    socket.on('chat message', (msg) => {
        // Gelen mesajı herkese yayınla
        io.emit('chat message', { 
            user: userName, 
            text: msg 
        });
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı.');
    });
});

// Render portu veya yerel 3000 portu
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu aktif: Port ${PORT}`);
});
