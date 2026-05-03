// index.js içindeki chat message kısmını bu hale getir
socket.on('chat message', (data) => {
    // Karmaşık çevirme işlemlerini bırakıyoruz, gelen mesajı olduğu gibi iletiyoruz
    io.emit('chat message', { 
        user: socket.nick, 
        text: data.text, 
        color: socket.color, 
        style: data.style 
    });
});
