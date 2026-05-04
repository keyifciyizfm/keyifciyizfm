<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keyifciyiz FM - Yayın Merkezi</title>
    <style>
        body { background: #121212; color: #eee; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .mixer-card { background: #1e1e1e; border: 1px solid #333; border-radius: 15px; padding: 30px; width: 350px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); text-align: center; }
        h2 { color: #f1c40f; margin-bottom: 25px; letter-spacing: 1px; }
        .input-group { margin-bottom: 15px; text-align: left; }
        label { font-size: 12px; color: #888; display: block; margin-bottom: 5px; }
        input[type="text"], input[type="password"], input[type="file"] { width: 100%; padding: 12px; background: #111; border: 1px solid #444; border-radius: 5px; color: #fff; outline: none; }
        .btn { width: 100%; padding: 15px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 10px; }
        #join-btn { background: #f1c40f; color: #000; }
        #live-btn { background: #e74c3c; color: #fff; display: none; }
        #live-btn.on { background: #2ecc71; animation: pulse 1.5s infinite; }
        .vol-control { margin-top: 20px; display: none; }
        input[type="range"] { width: 100%; accent-color: #f1c40f; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
    </style>
</head>
<body>

<div class="mixer-card" id="app">
    <h2>KEYİFCİYİZ FM</h2>
    
    <div id="login-zone">
        <div class="input-group">
            <input type="text" id="nick" placeholder="Kullanıcı Adı">
        </div>
        <div class="input-group">
            <input type="password" id="pass" placeholder="Şifre">
        </div>
        <button id="join-btn" class="btn" onclick="connect()">SİSTEME BAĞLAN</button>
    </div>

    <div id="dj-zone" style="display:none;">
        <div class="input-group">
            <label>MÜZİK DOSYASI SEÇ</label>
            <input type="file" id="file" accept="audio/*" onchange="setupAudio(this)">
            <audio id="audio-player" loop style="display:none;"></audio>
        </div>
        
        <div class="vol-control" id="vol-ui">
            <label>MÜZİK SES SEVİYESİ</label>
            <input type="range" min="0" max="1" step="0.05" value="0.5" oninput="if(gainNode) gainNode.gain.value = this.value">
        </div>

        <button id="live-btn" class="btn" onclick="toggleBroadcast()">YAYINI BAŞLAT</button>
        <p id="status" style="font-size: 11px; margin-top: 15px; color: #666;">Hazır</p>
    </div>

    <div id="user-zone" style="display:none;">
        <p style="color: #2ecc71;">📡 Yayına Bağlandınız...</p>
        <p style="font-size: 12px; color: #888;">Yayın başladığında ses otomatik gelecektir.</p>
    </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();
    let audioCtx, dest, gainNode, recorder, micStream;
    let queue = [], playing = false;

    function connect() {
        socket.emit('join', { 
            nick: document.getElementById('nick').value, 
            password: document.getElementById('pass').value 
        });
        // Tarayıcı ses kilidini aç
        new Audio().play().catch(()=>{});
    }

    socket.on('login_success', (data) => {
        document.getElementById('login-zone').style.display = 'none';
        if(data.role === 'DJ') {
            document.getElementById('dj-zone').style.display = 'block';
        } else {
            document.getElementById('user-zone').style.display = 'block';
        }
    });

    // DJ SİSTEMİ
    function setupAudio(input) {
        if(!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            dest = audioCtx.createMediaStreamDestination();
            gainNode = audioCtx.createGain();
            gainNode.connect(dest);
            gainNode.connect(audioCtx.destination);
            const source = audioCtx.createMediaElementSource(document.getElementById('audio-player'));
            source.connect(gainNode);
        }
        document.getElementById('audio-player').src = URL.createObjectURL(input.files[0]);
        document.getElementById('audio-player').play();
        document.getElementById('live-btn').style.display = 'block';
        document.getElementById('vol-ui').style.display = 'block';
    }

    async function toggleBroadcast() {
        const btn = document.getElementById('live-btn');
        if(btn.innerText === "YAYINI BAŞLAT") {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mic = audioCtx.createMediaStreamSource(micStream);
            mic.connect(dest);
            recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm; codecs=opus' });
            recorder.ondataavailable = (e) => socket.emit('voice-data', e.data);
            recorder.start(1000);
            btn.innerText = "🛑 YAYINI DURDUR";
            btn.classList.add('on');
            document.getElementById('status').innerText = "🔴 CANLI YAYIN YAPILIYOR";
        } else {
            recorder.stop();
            micStream.getTracks().forEach(t => t.stop());
            btn.innerText = "YAYINI BAŞLAT";
            btn.classList.remove('on');
            document.getElementById('status').innerText = "Yayın Durduruldu";
        }
    }

    // DİNLEYİCİ SİSTEMİ
    socket.on('audio-stream', (data) => {
        const url = URL.createObjectURL(new Blob([data], { type: 'audio/webm; codecs=opus' }));
        queue.push(url);
        if(!playing) playNext();
    });

    function playNext() {
        if(queue.length === 0) { playing = false; return; }
        playing = true;
        let url = queue.shift();
        let a = new Audio(url);
        a.onended = () => { URL.revokeObjectURL(url); playNext(); };
        a.play().catch(() => { playing = false; });
    }
</script>
</body>
</html>
