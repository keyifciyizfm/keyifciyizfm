<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keyifciyiz FM - Sade Mikser</title>
    <style>
        body { background: #121212; color: #eee; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1e1e1e; border: 1px solid #333; border-radius: 15px; padding: 30px; width: 350px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        h2 { color: #f1c40f; margin-bottom: 20px; }
        input { width: 100%; padding: 12px; background: #111; border: 1px solid #444; border-radius: 5px; color: #fff; margin-bottom: 10px; outline: none; }
        .btn { width: 100%; padding: 15px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        #join-btn { background: #f1c40f; color: #000; }
        #live-btn { background: #e74c3c; color: #fff; display: none; margin-top: 15px; }
        #live-btn.on { background: #2ecc71; animation: blink 1.5s infinite; }
        .vol { margin-top: 20px; display: none; }
        @keyframes blink { 50% { opacity: 0.7; } }
    </style>
</head>
<body>

<div class="card">
    <h2>KEYİFCİYİZ FM</h2>
    
    <div id="login-zone">
        <input type="text" id="nick" placeholder="Kullanıcı Adı">
        <input type="password" id="pass" placeholder="Şifre">
        <button id="join-btn" class="btn" onclick="connect()">SİSTEME BAĞLAN</button>
    </div>

    <div id="dj-zone" style="display:none;">
        <label style="font-size:12px; color:#888;">MÜZİK DOSYASI</label>
        <input type="file" id="file" accept="audio/*" onchange="initDJ(this)">
        <audio id="dj-player" loop style="display:none;"></audio>
        
        <div class="vol" id="vol-ui">
            <label style="font-size:12px; color:#888;">SES DÜZEYİ</label>
            <input type="range" min="0" max="1" step="0.05" value="0.5" oninput="if(gainNode) gainNode.gain.value = this.value">
        </div>
        <button id="live-btn" class="btn" onclick="toggleLive()">YAYINI BAŞLAT</button>
    </div>

    <div id="user-zone" style="display:none;">
        <p style="color:#2ecc71; font-weight:bold;">📡 YAYIN BEKLENİYOR...</p>
        <p style="font-size:11px; color:#666;">Yayın başladığında ses otomatik duyulacaktır.</p>
    </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();
    let audioCtx, dest, gainNode, recorder, micStream;
    let nextTime = 0; // Kesintisiz ekleme zamanlayıcısı

    // BAĞLAN VE SESİ UYANDIR
    function connect() {
        socket.emit('join', { 
            nick: document.getElementById('nick').value, 
            password: document.getElementById('pass').value 
        });
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume(); 
    }

    socket.on('login_success', (data) => {
        document.getElementById('login-zone').style.display = 'none';
        if(data.role === 'DJ') document.getElementById('dj-zone').style.display = 'block';
        else document.getElementById('user-zone').style.display = 'block';
    });

    // DİNLEYİCİ: UÇ UCA EKLEME (BUFFER) MOTORU
    socket.on('audio-stream', async (data) => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const buffer = await audioCtx.decodeAudioData(data);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);

        // Paketleri milisaniyelik boşluk kalmayacak şekilde uca ekle
        const start = Math.max(nextTime, audioCtx.currentTime);
        source.start(start);
        nextTime = start + buffer.duration;
    });

    // DJ MİKSER MOTORU
    function initDJ(input) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        dest = audioCtx.createMediaStreamDestination();
        gainNode = audioCtx.createGain();
        gainNode.connect(dest);
        gainNode.connect(audioCtx.destination);

        const source = audioCtx.createMediaElementSource(document.getElementById('dj-player'));
        source.connect(gainNode);

        document.getElementById('dj-player').src = URL.createObjectURL(input.files[0]);
        document.getElementById('dj-player').play();
        document.getElementById('live-btn').style.display = 'block';
        document.getElementById('vol-ui').style.display = 'block';
    }

    async function toggleLive() {
        const btn = document.getElementById('live-btn');
        if(btn.innerText === "YAYINI BAŞLAT") {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mic = audioCtx.createMediaStreamSource(micStream);
            mic.connect(dest);

            recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm; codecs=opus' });
            recorder.ondataavailable = (e) => { if(e.data.size > 0) socket.emit('voice-data', e.data); };
            
            recorder.start(1000); // Paketleri 1 saniyelik gönder (stabilite için)
            btn.innerText = "🛑 YAYINI DURDUR";
            btn.classList.add('on');
        } else {
            recorder.stop();
            micStream.getTracks().forEach(t => t.stop());
            btn.innerText = "YAYINI BAŞLAT";
            btn.classList.remove('on');
        }
    }
</script>
</body>
</html>
