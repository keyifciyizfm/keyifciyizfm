const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Public klasörünü dışarı açıyoruz
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    // Yeni biri bağlandığında rastgele bir Nick verelim (şimdilik)
    const userName = "Misafir-" + Math.floor(Math.random() * 1000);
    
    socket.on('chat message', (msg) => {
        io.emit('chat message', { user: userName, text: msg });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda hazır!`);
});
