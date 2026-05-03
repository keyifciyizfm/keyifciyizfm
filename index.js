const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const bcrypt = require('bcryptjs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Şimdilik kullanıcıları bellekte tutuyoruz
let users = []; 

// Kayıt Olma Endpointi
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.json({ success: true });
});

// Giriş Yapma Endpointi
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ success: true, username });
    } else {
        res.status(401).json({ success: false, message: "Hatalı kullanıcı adı veya şifre!" });
    }
});

io.on('connection', (socket) => {
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`KeyifciyizFM ${PORT} üzerinde çalışıyor`));
