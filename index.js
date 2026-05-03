const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.on('chat message', (data) => {
    // Gelen data artık hem kullanıcı adını hem mesajı içeriyor {user: "isim", text: "mesaj"}
    io.emit('chat message', data); 
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`KeyifciyizFM ${PORT} portunda hazır!`);
});
