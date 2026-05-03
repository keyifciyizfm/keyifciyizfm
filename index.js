const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// 'public' klasöründeki dosyaları (index.html vb.) dışarı açar
app.use(express.static(path.join(__dirname, 'public')));

// Kullanıcı bağlandığında çalışır
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı');

    // Mesaj geldiğinde herkese dağıtır
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı');
    });
});

// Render ve yerel çalışma için port ayarı
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`KeyifciyizFM sunucusu ${PORT} portunda başarıyla başlatıldı.`);
});
