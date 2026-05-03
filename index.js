// En üste boş bir engellenenler listesi ekle
let bannedUsers = []; 

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        // Giriş yapmaya çalışan engelli mi?
        if (bannedUsers.includes(data.username)) {
            return socket.emit('errorMsg', 'Bu odaya girişiniz engellenmiştir.');
        }

        let role = "Üye";
        if (data.password === "admin123") role = "SÜPER ADMİN";
        // ... geri kalan join işlemleri ...
    });

    // ENGELLEME KOMUTU (Sadece Adminler için)
    socket.on('banUser', (targetUsername) => {
        const admin = connectedUsers[socket.id];
        if (admin && admin.role === "SÜPER ADMİN") {
            bannedUsers.push(targetUsername);
            
            // Engellenen kişiyi bul ve bağlantısını kes
            const targetSocketId = Object.keys(connectedUsers).find(
                id => connectedUsers[id].username === targetUsername
            );

            if (targetSocketId) {
                io.to(targetSocketId).emit('banned', 'Admin tarafından engellendiniz.');
                io.sockets.sockets.get(targetSocketId).disconnect();
            }

            io.emit('message', {
                user: 'Sistem',
                text: `${targetUsername} sistemden uzaklaştırıldı.`,
                type: 'system'
            });
        }
    });
});
