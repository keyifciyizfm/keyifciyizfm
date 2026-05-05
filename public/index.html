<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Keyifciyiz FM - Canlı Sohbet & Mixer</title>
    <style>
        /* SENİN ORİJİNAL TASARIMIN */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #1a1a1a; font-family: 'Verdana', sans-serif; color: #ccc; height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden; }
        #login-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; justify-content: center; align-items: center; z-index: 9999; }
        #login-box { background: #333; padding: 30px; border: 2px solid #555; text-align: center; border-radius: 8px; width: 320px; box-shadow: 0 0 20px #000; }
        #nick-input, #pass-input { width: 100%; padding: 12px; margin-bottom: 12px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; outline: none; }
        #chat-container { width: 950px; height: 620px; background: #3b3b3b; border: 2px solid #444; display: flex; flex-direction: column; position: relative; }
        #top-gradient { height: 15px; width: 100%; background: linear-gradient(to right, #2ecc71, #f1c40f, #e74c3c); }
        #action-bar { background: #4a4a4a; padding: 10px; display: flex; align-items: center; border-bottom: 2px solid #222; z-index: 500; }
        .tool-group { display: flex; align-items: center; gap: 8px; padding: 0 12px; border-right: 1px solid #555; height: 25px; }
        .f-btn { background: linear-gradient(to bottom, #777, #333); border: 1px solid #111; color: #fff; padding: 5px 12px; font-size: 11px; cursor: pointer; border-radius: 3px; }
        .f-btn.active { background: #2ecc71 !important; color: #000; font-weight: bold; }
        #main-area { display: flex; flex: 1; overflow: hidden; background: #222; padding: 8px; gap: 8px; }
        #messages { flex: 3; background: #000; border: 1px solid #444; padding: 12px; overflow-y: auto; font-size: 13px; color: #fff; background-size: cover; background-position: center; }
        #user-list { flex: 1; background: #111; border: 1px solid #444; padding: 12px; font-size: 12px; }

        /* YENİ: YÜZEN MIXER PANELİ */
        #floating-mixer { 
            position: absolute; top: 80px; left: 50px; width: 380px; 
            background: #2c3e50; border: 3px solid #1a252f; border-radius: 12px; 
            z-index: 3000; display: none; flex-direction: column; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.9);
        }
        #mixer-header { background: #1a252f; padding: 12px; color: #2ecc71; font-weight: bold; cursor: move; display: flex; justify-content: space-between; border-radius: 8px 8px 0 0; }
        .mixer-body { padding: 15px; display: flex; flex-direction: column; gap: 15px; }
        .mixer-row { background: #34495e; padding: 10px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; }
        #playlist-area { background: #000; height: 200px; overflow-y: auto; border: 1px solid #444; border-radius: 4px; padding: 5px; font-size: 11px; }
        .track-item { display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #222; }
        .led { width: 12px; height: 12px; background: #333; border-radius: 50%; }
        .led-live { background: #ff4757; box-shadow: 0 0 10px #ff4757; animation: blink 1s infinite; }
        @keyframes blink { 50% { opacity: 0.3; } }
    </style>
</head>
<body>

<div id="login-overlay">
    <div id="login-box">
        <h3 style="color:#2ecc71; margin-bottom:15px;">Keyifciyiz FM</h3>
        <input type="text" id="nick-input" placeholder="Nickiniz..." onkeyup="checkAdmin(this.value)">
        <div id="pass-area" style="display:none;"><input type="password" id="pass-input" placeholder="Şifre..."></div>
        <button class="f-btn" onclick="joinChat()" style="padding:10px 40px; background:#2ecc71; color:#000;">BAĞLAN</button>
    </div>
</div>

<div id="chat-container">
    <div id="top-gradient"></div>
    <div id="action-bar">
        <div class="tool-group"><button class="f-btn" onclick="toggleEmojiPanel(event)">😊 Emojiler</button></div>
        <div class="tool-group">
            <button class="f-btn" onclick="changeFontSize(2)">A+</button>
            <button class="f-btn" onclick="changeFontSize(-2)">A-</button>
        </div>
        <div class="tool-group" id="admin-tools" style="display:none;">
            <button class="f-btn" style="color:#f1c40f; border-color:#f1c40f;" onclick="toggleMixer()">🎚️ MASTER MIXER</button>
            <button class="f-btn" style="color:#f1c40f;" onclick="clearChat()">🧹 Temizle</button>
            <input type="file" id="bg-upload" style="display:none;" onchange="uploadBg(this)">
            <button class="f-btn" style="color:#3498db;" onclick="document.getElementById('bg-upload').click()">🖼️ Arkaplan</button>
        </div>
        <div style="flex:1;"></div>
        <button class="f-btn" onclick="location.reload()">Çıkış</button>
    </div>

    <div id="floating-mixer">
        <div id="mixer-header">
            <span>🎚️ YAYIN MIXERI V1.0</span>
            <button onclick="toggleMixer()" style="background:none; border:none; color:#fff; cursor:pointer;">[X]</button>
        </div>
        <div class="mixer-body">
            <div class="mixer-row">
                <button id="live-toggle" class="f-btn" style="background:#27ae60; width:150px;" onclick="toggleBroadcasting()">🔴 YAYINI BAŞLAT</button>
                <div id="live-led" class="led"></div>
            </div>
            <div class="mixer-row">
                <label style="font-size:11px; color:#fff;"><input type="checkbox" id="mic-check"> MİKROFONU AÇ</label>
                <input type="range" id="mic-vol" min="0" max="1" step="0.1" value="0.8" style="width:100px;">
            </div>
            <div style="font-size:11px; margin-top:5px;">MÜZİK KÜTÜPHANESİ (MAX 30)</div>
            <input type="file" id="music-load" multiple accept="audio/*" style="font-size:10px; color:#aaa;">
            <div id="playlist-area"></div>
        </div>
    </div>

    <div id="main-area">
        <div id="messages"></div>
        <div id="user-list">
            <div id="fixed-admin">
                <div style="font-size:9px; color:#666;">YAYINDA</div>
                <div id="admin-display-name">Keyifciyiz_Fm</div>
            </div>
            <div id="users"></div>
        </div>
    </div>

    <form id="form" onsubmit="sendMessage(event)" style="display:flex; padding:10px; background:#3b3b3b; gap:5px;">
        <input id="input" autocomplete="off" placeholder="Mesaj yaz..." />
        <button type="submit" class="f-btn">GÖNDER</button>
    </form>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();
    let myNick = "", myRole = "", audioCtx, gainNode, nextTime = 0, isLive = false;
    let playlistFiles = [];

    // --- MIXER SÜRÜKLEME ---
    const mixer = document.getElementById('floating-mixer');
    const mHead = document.getElementById('mixer-header');
    let isDragging = false;
    mHead.onmousedown = () => isDragging = true;
    window.onmouseup = () => isDragging = false;
    window.onmousemove = (e) => { if(isDragging) { mixer.style.left = e.clientX-190+'px'; mixer.style.top = e.clientY-20+'px'; } };

    function toggleMixer() { mixer.style.display = mixer.style.display === 'flex' ? 'none' : 'flex'; }

    // --- MÜZİK YÜKLEME VE LİSTELEME ---
    document.getElementById('music-load').onchange = (e) => {
        playlistFiles = Array.from(e.target.files).slice(0, 30);
        const area = document.getElementById('playlist-area');
        area.innerHTML = "";
        playlistFiles.forEach((f, i) => {
            area.innerHTML += `<div class="track-item"><span>${i+1}. ${f.name.slice(0,25)}</span> <button class="f-btn" onclick="playMusic(${i})">ÇAL</button></div>`;
        });
    };

    // --- SES MOTORU (YAYINCI VE DİNLEYİCİ İÇİN) ---
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
        }
    }

    async function toggleBroadcasting() {
        initAudio();
        if (!isLive) {
            isLive = true;
            document.getElementById('live-toggle').innerText = "⬛ YAYINI DURDUR";
            document.getElementById('live-toggle').style.background = "#c0392b";
            document.getElementById('live-led').classList.add('led-live');
        } else {
            location.reload(); // En güvenli durdurma yöntemi
        }
    }

    async function playMusic(index) {
        if (!isLive) return alert("Önce yayını başlatmalısın!");
        const file = playlistFiles[index];
        const buffer = await file.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(buffer);
        
        const source = audioCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(gainNode);
        source.start(0);

        // Ses paketlerini socket üzerinden gönder (Örn: Stream API veya ScriptProcessor ile)
        // Basitlik ve performans için burada yayıncı kendi sesini de duyar.
        socket.emit('audio-packet', buffer); 
    }

    // --- DİNLEYİCİ SESİ ALMA ---
    socket.on('audio-stream', async (buf) => {
        initAudio();
        const decoded = await audioCtx.decodeAudioData(buf);
        const source = audioCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(gainNode);
        if (nextTime < audioCtx.currentTime) nextTime = audioCtx.currentTime + 0.1;
        source.start(nextTime);
        nextTime += decoded.duration;
    });

    // --- SENİN ORİJİNAL CHAT FONKSİYONLARIN ---
    function checkAdmin(v) { document.getElementById('pass-area').style.display = (v === "Keyifciyiz_Fm") ? "block" : "none"; }
    function joinChat() {
        initAudio(); // Tarayıcı engelini aşmak için
        const n = document.getElementById('nick-input').value.trim();
        const p = document.getElementById('pass-input').value.trim();
        if(n) socket.emit('join', { nick: n, password: p });
    }

    socket.on('login success', d => {
        myNick = d.nick; myRole = d.role;
        document.getElementById('login-overlay').style.display = 'none';
        if(myRole === 'Yönetici') document.getElementById('admin-tools').style.display = 'flex';
    });

    socket.on('chat message', d => {
        const div = document.createElement('div');
        div.innerHTML = `<b style="color:${d.color}">${d.user}:</b> <span>${d.text}</span>`;
        document.getElementById('messages').appendChild(div);
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    });

    socket.on('user list', data => {
        const uDiv = document.getElementById('users'); uDiv.innerHTML = '';
        data.list.forEach(u => {
            if(u.nick !== "Keyifciyiz_Fm") {
                uDiv.innerHTML += `<div style="padding:5px; color:${u.color}">• ${u.nick}</div>`;
            }
        });
    });

    function sendMessage(e) {
        e.preventDefault();
        const i = document.getElementById('input');
        if(i.value) { socket.emit('chat message', { text: i.value }); i.value = ''; }
    }
</script>
</body>
</html>
