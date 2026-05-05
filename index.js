const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // Büyük ses verileri için buffer kapasitesini artırdık
});

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; 
let userStatus = {}; 
let currentBackground = ""; 
let adminCount = 0; 
let shutdownTimer = null; 

const masterNick = "Keyifciyiz_Fm";
const masterPass = "123456";

// EMOJİ PARSER
function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "1f604", ":joy:": "1f602", ":kiss:": "1f618", ":heart:": "2764",
        ":fire:": "1f525", ":rose:": "1f339", ":thumbsup:": "1f44d", ":microphone:": "1f399",
        ":wink:": "1f609", ":star:": "2b50", ":coffee:": "2615", ":musical_note:": "1f3b5"
    };
    let newText = text;
    for (const [code, id] of Object.entries(emojiMap)) {
        const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.webp`;
        newText = newText.replace(new RegExp(code, 'g'), `<img src="${url}" style="width:22px; height:22px; vertical-align:middle; margin:0 2px;">`);
    }
    return newText;
}

// SERVER LOGIC
io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const isTargetAdmin = (data.nick === masterNick);
        if (adminCount === 0 && !isTargetAdmin) {
            return socket.emit('auth error', 'Yayıncı şu an yayında değil, oda kapalı!');
        }
        if (isTargetAdmin && data.password !== masterPass) {
            return socket.emit('auth error', 'Hatalı Yönetici Şifresi!');
        }
        if (isTargetAdmin) {
            adminCount++;
            if (shutdownTimer) {
                clearTimeout(shutdownTimer);
                shutdownTimer = null;
            }
        }
        
        socket.nick = data.nick || "Misafir";
        socket.role = isTargetAdmin ? 'Yönetici' : 'Dinleyici';
        socket.color = isTargetAdmin ? (data.color || '#ff4757') : '#2ecc71';
        
        if (userStatus[socket.nick] === undefined) userStatus[socket.nick] = 0;
        users[socket.id] = { id: socket.id, nick: socket.nick, role: socket.role, color: socket.color, status: userStatus[socket.nick] };
        
        socket.emit('login success', { role: socket.role, nick: socket.nick });
        socket.emit('status update', userStatus[socket.nick]);
        if (currentBackground !== "") socket.emit('background changed', currentBackground);
        io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
    });

    // RADYO YAYIN LOGIC
    socket.on('audio-stream', (blob) => {
        if (socket.role === 'Yönetici') {
            socket.broadcast.emit('audio-stream', blob);
        }
    });

    socket.on('stream-status', (status) => {
        if (socket.role === 'Yönetici') {
            io.emit('chat message', { user: "SİSTEM", text: status ? "🔴 Canlı yayın başladı!" : "⚪ Yayın durduruldu.", color: status ? "#e74c3c" : "#95a5a6" });
        }
    });

    // CHAT LOGIC (Kısa versiyon)
    socket.on('chat message', (data) => {
        if (users[socket.id]) {
            const u = users[socket.id];
            if (userStatus[u.nick] === 2) return;
            const msgData = { user: u.nick, text: parseEmojis(data.text), color: data.color || u.color, style: data.style, isMuted: (userStatus[u.nick] === 1) };
            io.emit('chat message', msgData);
        }
    });

    socket.on('clear chat', () => { if (socket.role === 'Yönetici') io.emit('chat cleared'); });
    socket.on('change background', (url) => { if (socket.role === 'Yönetici') { currentBackground = url; io.emit('background changed', url); } });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            if (users[socket.id].role === 'Yönetici') {
                adminCount--;
                if (adminCount <= 0) {
                    shutdownTimer = setTimeout(() => { io.emit('force logout'); users = {}; adminCount = 0; }, 60000); 
                }
            }
            delete users[socket.id];
            io.emit('user list', { list: Object.values(users), adminOnline: (adminCount > 0) });
        }
    });
});

// HTML & CLIENT SIDE (Tek dosya içinde döndürmek için)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Keyifciyiz FM - Canlı Radyo & Sohbet</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #1a1a1a; font-family: 'Verdana', sans-serif; color: #ccc; height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden; }
        #login-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; justify-content: center; align-items: center; z-index: 9999; }
        #login-box { background: #333; padding: 30px; border: 2px solid #555; text-align: center; border-radius: 8px; width: 320px; }
        #chat-container { width: 950px; height: 680px; background: #3b3b3b; border: 2px solid #444; display: flex; flex-direction: column; position: relative; }
        #action-bar { background: #4a4a4a; padding: 10px; display: flex; align-items: center; border-bottom: 2px solid #222; }
        #main-area { display: flex; flex: 1; overflow: hidden; background: #222; padding: 8px; gap: 8px; }
        #messages { flex: 3; background: #000; border: 1px solid #444; padding: 12px; overflow-y: auto; font-size: 13px; background-size: cover; }
        #user-list { flex: 1; background: #111; border: 1px solid #444; padding: 12px; font-size: 12px; }
        .f-btn { background: linear-gradient(to bottom, #777, #333); border: 1px solid #111; color: #fff; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-size: 11px; }
        .tool-group { display: flex; align-items: center; gap: 5px; padding: 0 10px; border-right: 1px solid #555; }
        #radio-panel { background: #222; border-top: 2px solid #444; padding: 10px; display: flex; align-items: center; justify-content: space-between; }
        #playlist { background: #333; color: #fff; font-size: 11px; border: 1px solid #555; padding: 3px; width: 120px; }
        .active { background: #2ecc71 !important; color: #000; }
    </style>
</head>
<body>

<div id="login-overlay">
    <div id="login-box">
        <h3 style="color:#2ecc71; margin-bottom:15px;">Keyifciyiz FM</h3>
        <input type="text" id="nick-input" placeholder="Nick..." style="width:100%; padding:10px; margin-bottom:10px;">
        <input type="password" id="pass-input" placeholder="Şifre (Sadece Admin)" style="width:100%; padding:10px; margin-bottom:10px;">
        <button class="f-btn" onclick="joinChat()" style="width:100%; padding:10px;">BAĞLAN</button>
        <p id="error-msg" style="color:red; margin-top:10px; display:none;"></p>
    </div>
</div>

<div id="chat-container">
    <div id="action-bar">
        <div class="tool-group"><button class="f-btn" onclick="toggleEmojiPanel()">😊 Emoji</button></div>
        <div class="tool-group">
            <button id="btn-bold" class="f-btn" onclick="toggleStyle('bold')">B</button>
            <input type="color" id="colorPicker" onchange="handleColorChange(this.value)" style="width:30px;">
        </div>
        <div id="admin-tools" style="display:none;" class="tool-group">
            <button class="f-btn" onclick="socket.emit('clear chat')">🧹 Temizle</button>
        </div>
        <div style="flex:1"></div>
        <div id="live-status" style="color:#666; font-weight:bold; font-size:12px;">● YAYIN YOK</div>
    </div>

    <div id="main-area">
        <div id="messages"></div>
        <div id="user-list">
            <div style="text-align:center; padding:10px; border:1px solid #333; margin-bottom:10px;">
                <div style="font-size:9px; color:gray;">YAYINDA</div>
                <div id="admin-name" style="color:#ff4757; font-weight:bold;">Keyifciyiz_Fm</div>
            </div>
            <b>Dinleyiciler</b><hr><div id="users"></div>
        </div>
    </div>

    <div id="radio-panel">
        <div style="display:flex; align-items:center; gap:10px;">
            <input type="range" id="volume" min="0" max="1" step="0.1" value="0.5">
            <audio id="radio-player" autoplay></audio>
        </div>
        
        <div id="admin-radio-ui" style="display:none; gap:10px; align-items:center;">
            <label style="font-size:11px;"><input type="checkbox" id="mic-toggle"> 🎤 Mikrofon</label>
            <input type="file" id="music-files" multiple accept="audio/*" style="display:none" onchange="updatePlaylist(this)">
            <button class="f-btn" onclick="document.getElementById('music-files').click()">🎵 Müzik Seç</button>
            <select id="playlist"></select>
            <button id="broadcast-btn" class="f-btn" style="background:#e74c3c" onclick="toggleBroadcast()">🔴 Yayını Başlat</button>
        </div>
    </div>

    <form onsubmit="sendMsg(event)" style="display:flex; padding:10px; background:#333;">
        <input id="input" autocomplete="off" style="flex:1; padding:10px; background:#000; color:#fff; border:1px solid #555;">
        <button type="submit" class="f-btn">GÖNDER</button>
    </form>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();
    let myRole = "", isBroadcasting = false, audioCtx, streamerInterval;

    function joinChat() {
        const nick = document.getElementById('nick-input').value;
        const pass = document.getElementById('pass-input').value;
        socket.emit('join', { nick, password: pass });
    }

    socket.on('auth error', m => { alert(m); });
    socket.on('login success', d => {
        myRole = d.role;
        document.getElementById('login-overlay').style.display = 'none';
        if(d.role === 'Yönetici') {
            document.getElementById('admin-tools').style.display = 'flex';
            document.getElementById('admin-radio-ui').style.display = 'flex';
        }
    });

    // RADYO LOGIC
    async function toggleBroadcast() {
        if (!isBroadcasting) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const dest = audioCtx.createMediaStreamDestination();
            
            // Mikrofon
            if (document.getElementById('mic-toggle').checked) {
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioCtx.createMediaStreamSource(micStream).connect(dest);
            }

            // Müzik
            const playlist = document.getElementById('playlist');
            if (playlist.value) {
                const file = document.getElementById('music-files').files[playlist.selectedIndex];
                const audio = new Audio(URL.createObjectURL(file));
                const source = audioCtx.createMediaElementSource(audio);
                source.connect(dest);
                source.connect(audioCtx.destination);
                audio.play();
            }

            const recorder = new MediaRecorder(dest.stream);
            recorder.ondataavailable = e => socket.emit('audio-stream', e.data);
            recorder.start(500);
            
            isBroadcasting = true;
            document.getElementById('broadcast-btn').innerText = "⬛ Durdur";
            socket.emit('stream-status', true);
        } else {
            location.reload();
        }
    }

    function updatePlaylist(input) {
        const sel = document.getElementById('playlist');
        sel.innerHTML = "";
        Array.from(input.files).forEach((f, i) => {
            sel.innerHTML += \`<option value="\${i}">\${f.name}</option>\`;
        });
    }

    // DINLEYICI SES ALIMI
    const mediaSource = new MediaSource();
    const player = document.getElementById('radio-player');
    let sourceBuffer;
    player.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', () => {
        sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs="opus"');
    });

    socket.on('audio-stream', async (blob) => {
        document.getElementById('live-status').innerText = "● CANLI YAYIN";
        document.getElementById('live-status').style.color = "#e74c3c";
        const buf = await blob.arrayBuffer();
        if (sourceBuffer && !sourceBuffer.updating) sourceBuffer.appendBuffer(buf);
    });

    // CHAT & UI
    function sendMsg(e) {
        e.preventDefault();
        const input = document.getElementById('input');
        if(input.value) {
            socket.emit('chat message', { text: input.value, style: {bold: false} });
            input.value = "";
        }
    }

    socket.on('chat message', d => {
        const div = document.createElement('div');
        div.innerHTML = \`<b style="color:\${d.color}">\${d.user}:</b> \${d.text}\`;
        document.getElementById('messages').appendChild(div);
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    });

    socket.on('user list', data => {
        const uDiv = document.getElementById('users');
        uDiv.innerHTML = data.list.map(u => \`<div style="color:\${u.color}">● \${u.nick}</div>\`).join('');
    });

    document.getElementById('volume').oninput = (e) => player.volume = e.target.value;
</script>
</body>
</html>
    `);
});

server.listen(3000, () => console.log('Sistem 3000 portunda aktif.'));
