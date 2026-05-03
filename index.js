const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bcrypt = require('bcryptjs');

app.use(express.static('public'));
app.use(express.json());

let usersDB = []; 
let onlineUsers = new Set();

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if(usersDB.find(u => u.username === username)) return res.json({success: false});
    const hashedPassword = await bcrypt.hash(password, 10);
    usersDB.push({ username, password: hashedPassword });
    res.json({ success: true });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = usersDB.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

io.on('connection', (socket) => {
    let currentUser = "";

    socket.on('user joined', (username) => {
        currentUser = username;
        onlineUsers.add(username);
        io.emit('update users', Array.from(onlineUsers));
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    socket.on('disconnect', () => {
        if(currentUser) {
            onlineUsers.delete(currentUser);
            io.emit('update users', Array.from(onlineUsers));
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('KeyifciyizFM Pro Aktif!'));
