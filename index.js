const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı');
    
    // DJ'den gelen mikser hareketlerini dinleyicilere gönder
    socket.on('mixer-move', (data) => {
        socket.broadcast.emit('listener-update', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
