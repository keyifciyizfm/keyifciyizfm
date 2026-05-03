<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Sohbet & DJ Studio - Keyifciyiz FM</title>
    <style>
        /* MEVCUT TASARIMININ DEVAMI */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #1a1a1a; font-family: 'Verdana', sans-serif; color: #ccc; height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden; }
        #login-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 5000; }
        #login-box { background: #333; padding: 30px; border: 2px solid #555; text-align: center; border-radius: 5px; width: 320px; }
        #chat-container { width: 950px; height: 620px; background: #3b3b3b; border: 2px solid #444; display: flex; flex-direction: column; position: relative; }
        #top-gradient { height: 15px; width: 100%; background: linear-gradient(to right, #2ecc71, #f1c40f, #e74c3c); }
        #action-bar { background: #4a4a4a; padding: 10px; display: flex; align-items: center; border-bottom: 2px solid #222; }
        .f-btn { background: linear-gradient(to bottom, #777, #333); border: 1px solid #111; color: #fff; padding: 6px 12px; font-size: 11px; cursor: pointer; border-radius: 3px; display: flex; align-items: center; min-width: 35px; justify-content: center; }
        .f-btn.active { background: #2ecc71 !important; color: #000 !important; }
        #main-area { display: flex; flex: 1; overflow: hidden; background: #222; padding: 8px; gap: 8px; }
        #messages { flex: 3; background: #000; border: 1px solid #444; padding: 12px; overflow-y: auto; border-radius: 2px; font-size: 13px; color: #fff; }
        #user-list { flex: 1; background: #111; border: 1px solid #444; padding: 12px; font-size: 12px; overflow-y: auto; }
        
        /* YÜZEN MİKSER STİLLERİ */
        #dj-mixer { 
            display: none; position: absolute; top: 20px; right: 20px; width: 280px; 
            background: #2a2a2a; border: 2px solid #f1c40f; border-radius: 8px; 
            z-index: 4000; cursor: move; box-shadow: 0 10px 30px rgba(0,0,0,0.5); padding: 10px;
        }
        .mixer-head { background: #f1c40f; color: #000; padding: 5px; font-weight: bold; font-size: 11px; margin: -10px -10px 10px -10px; border-radius: 5px 5px 0 0; cursor: move; text-align: center;}
        .mixer-sec { background: #1a1a1a; padding: 8px; margin-bottom: 8px; border-radius: 4px; border: 1px solid #444; }
        .playlist { height: 100px; overflow-y: auto; background: #000; font-size: 10px; padding: 5px; margin-top: 5px; border: 1px solid #333; }
        .playlist-item { padding: 4px; border-bottom: 1px solid #222; cursor: pointer; white-space: nowrap; overflow: hidden; }
        .playlist-item:hover { background: #333; }
        .slider-box { display: flex; align-items: center; gap: 10px; font-size: 10px; margin-top: 5px; }
        .v-range { flex: 1; cursor: pointer; accent-color: #2ecc71; }

        /* Klasik diğer stiller */
        #emoji-panel { display: none; position: absolute; bottom: 65px; left: 12px; background: #333; border: 2px solid #555; padding: 15px; flex-wrap: wrap; gap: 10px; width: 280px; border-radius: 8px; box-shadow: 0 -5px 25px #000; z-index: 50; }
        .emoji-item { cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
        form#form { display: flex; padding: 12px; background: #3b3b3b; gap: 8px; border-top: 1px solid #444; }
        #input { flex: 1; background: #000; color: #fff; border: 1px solid #555; padding: 10px; outline: none; }
        #custom-menu { display: none; position: absolute; background: #2a2a2a; border: 1px solid #f1c40f88; z-index: 2000; width: 160px; }
        .menu-item { padding: 10px 15px; cursor: pointer; color: #ddd; font-size: 12px; }
    </style>
</head>
<body>

<div id="login-overlay">
    <div id="login-box">
        <h3 style="color:#2ecc71; margin-bottom:15px;">Keyifciyiz FM</h3>
        <input type="text" id="nick-input" placeholder="Nickiniz..." oninput="checkAdmin(this.value)" style="padding:10px; margin-bottom:10px; display:block; width:100%; background:#222; color:#fff; border:1px solid #444;">
        <div id="pass-area" style="display:none;"><input type="password" id="pass-input" placeholder="Şifre..." style="padding:10px; margin-bottom:10px; display:block; width:100%; background:#222; color:#fff; border:1px solid #444;"></div>
        <button class="f-btn" style="margin: 0 auto; padding: 10px 30px;" onclick="joinChat()">BAĞLAN</button>
    </div>
</div>

<div id="dj-mixer">
    <div class="mixer-head" id="mixer-drag">STUDIO MIXER (DRAG)</div>
    
    <div class="mixer-sec">
        <div style="display:flex; gap:5px;">
            <button id="stream-btn" class="f-btn" style="flex:1;" onclick="toggleMasterStream()">📡 YAYINA BAŞLA</button>
            <button id="anons-btn" class="f-btn" style="flex:1;" onclick="toggleAnons()">🎙️ ANONS (OFF)</button>
        </div>
    </div>

    <div class="mixer-sec">
        <button class="f-btn" style="width:100%; background:#3498db !important;" onclick="document.getElementById('music-files').click()">+ Müzikleri Yükle</button>
        <input type="file" id="music-files" multiple hidden accept="audio/*" onchange="addToPlaylist(this)">
        <div class="playlist" id="playlist">
            <div style="color:#666; text-align:center; padding-top:20px;">Liste Boş</div>
        </div>
        <div class="slider-box">
            <span>VOL:</span>
            <input type="range" class="v-range" min="0" max="1" step="0.1" value="0.5" oninput="adjustMusicVol(this.value)">
        </div>
        <div id="now-playing" style="font-size:9px; color:#f1c40f; margin-top:5px; text-align:center;">---</div>
    </div>
    
    <audio id="local-player" onended="playNext()" controls style="width:100%; height:30px; margin-top:5px;"></audio>
</div>

<div id="custom-menu">
    <div class="menu-item" onclick="kickAction()" style="color:#ff4757;">🚫 Odadan At</div>
</div>

<div id="chat-container">
    <div id="top-gradient"></div>
    <div id="action-bar">
        <button class="f-btn" onclick="toggleEmojiPanel(event)">😊 Emojiler</button>
        <div style="margin-left: 20px; display: flex; align-items: center; gap: 5px;">
            <button class="f-btn" onclick="changeFontSize(2)">A+</button>
            <button class="f-btn" onclick="changeFontSize(-2)">A-</button>
            <button id="btn-bold" class="f-btn" onclick="toggleStyle('bold')"><b>A</b></button>
        </div>
        <input type="color" id="colorPicker" value="#2ecc71" onchange="changeColor(this.value)" style="margin-left:20px; width:35px;">
        <div style="flex: 1;"></div>
        <button class="f-btn" onclick="location.reload()">Çıkış</button>
    </div>

    <div id="main-area">
        <div id="messages"></div>
        <div id="user-list"><b style="color:#f1c40f">Dinleyiciler</b><hr style="margin:10px 0; border:#333 1px solid;"><div id="users"></div></div>
    </div>

    <div id="emoji-panel"></div>

    <form id="form" onsubmit="sendMessage(event)">
        <input id="input" autocomplete="off" placeholder="Mesaj yaz..." />
        <button type="submit" class="f-btn">GÖNDER</button>
    </form>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    var socket = io();
    var myNick = "", myRole = "", selectedTarget = "", currentFontSize = 13, selectedColor = "#2ecc71", styles = { bold: false };
    
    // MİKSER DEĞİŞKENLERİ
    let audioCtx, dest, musicNode, musicGain, micNode, micGain, recorder, playlist = [], currentIdx = -1;

    // Emojiler (Mevcut kodun)
    const emojis = [{c: ':smile:', i: '1f60a'}, {c: ':joy:', i: '1f602'}, {c: ':cool:', i: '1f60e'}, {c: ':heart:', i: '2764'}, {c: ':fire:', i: '1f525'}, {c: ':rose:', i: '1f339'}, {c: ':thumbsup:', i: '1f44d'}, {c: ':microphone:', i: '1f399'}, {c: ':wink:', i: '1f609'}, {c: ':star:', i: '2b50'}, {c: ':coffee:', i: '2615'}, {c: ':musical_note:', i: '1f3b5'}];
    const panel = document.getElementById('emoji-panel');
    emojis.forEach(e => {
        let d = document.createElement('div'); d.className = 'emoji-item';
        d.innerHTML = `<img src="https://raw.githubusercontent.com/jakejarvis/apple-emoji-svg/main/emoji/${e.i}.svg" style="width:24px;">`;
        d.onclick = () => { document.getElementById('input').value += e.c + ' '; document.getElementById('input').focus(); };
        panel.appendChild(d);
    });

    function checkAdmin(v) { document.getElementById('pass-area').style.display = (v === "Keyifciyiz_Fm") ? "block" : "none"; }
    function joinChat() { const n = document.getElementById('nick-input').value, p = document.getElementById('pass-input').value; if(n) socket.emit('join', { nick: n, password: p }); }
    
    socket.on('login success', d => { 
        myNick = d.nick; myRole = d.role; 
        document.getElementById('login-overlay').style.display = 'none'; 
        if(myRole === "Yönetici") document.getElementById('dj-mixer').style.display = 'block';
    });

    // MÜZİK VE YAYIN MOTORU
    function setupAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            dest = audioCtx.createMediaStreamDestination();
            musicGain = audioCtx.createGain();
            musicGain.gain.value = 0.5;
            musicGain.connect(dest);
            musicGain.connect(audioCtx.destination);
            
            const player = document.getElementById('local-player');
            musicNode = audioCtx.createMediaElementSource(player);
            musicNode.connect(musicGain);
        }
    }

    function addToPlaylist(input) {
        setupAudio();
        const files = Array.from(input.files);
        files.forEach(f => {
            playlist.push(f);
            const item = document.createElement('div');
            item.className = 'playlist-item';
            item.innerText = f.name;
            item.onclick = () => playMusic(playlist.indexOf(f));
            document.getElementById('playlist').appendChild(item);
        });
        if(currentIdx === -1) playMusic(0);
    }

    function playMusic(index) {
        if(!playlist[index]) return;
        currentIdx = index;
        const player = document.getElementById('local-player');
        player.src = URL.createObjectURL(playlist[index]);
        player.play();
        document.getElementById('now-playing').innerText = "Çalıyor: " + playlist[index].name;
    }

    function playNext() { if(currentIdx < playlist.length - 1) playMusic(currentIdx + 1); }
    function adjustMusicVol(v) { if(musicGain) musicGain.gain.value = v; }

    async function toggleMasterStream() {
        const btn = document.getElementById('stream-btn');
        if (btn.innerText.includes("BAŞLA")) {
            setupAudio();
            recorder = new MediaRecorder(dest.stream);
            recorder.ondataavailable = (e) => socket.emit('voice-data', e.data);
            recorder.start(200);
            btn.innerText = "🛑 YAYINI DURDUR"; btn.classList.add('active');
        } else {
            recorder.stop(); btn.innerText = "📡 YAYINA BAŞLA"; btn.classList.remove('active');
        }
    }

    async function toggleAnons() {
        const btn = document.getElementById('anons-btn');
        if (!micNode) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micNode = audioCtx.createMediaStreamSource(stream);
            micGain = audioCtx.createGain();
            micGain.connect(dest);
            micNode.connect(micGain);
        }

        if (btn.innerText.includes("OFF")) {
            musicGain.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.5); // Müziği kıs
            micGain.gain.value = 1.0;
            btn.innerText = "🎙️ ANONS (ON)"; btn.classList.add('active');
        } else {
            musicGain.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.5); // Müziği aç
            micGain.gain.value = 0.0;
            btn.innerText = "🎙️ ANONS (OFF)"; btn.classList.remove('active');
        }
    }

    // Dinleyici tarafı ses alma
    socket.on('audio-stream', (data) => {
        const blob = new Blob([data], { type: 'audio/webm' });
        new Audio(URL.createObjectURL(blob)).play().catch(()=>{});
    });

    // Klasik Sohbet Fonksiyonları (Senin Kodun)
    socket.on('chat message', d => {
        const div = document.createElement('div'); div.style.marginBottom = "8px";
        div.innerHTML = `<b style="color:${d.color}; cursor:pointer;" onclick="openAdminMenu('${d.user}', event)">${d.user}:</b> <span style="color:${d.color}; font-weight:${d.style?.bold?'bold':'normal'};">${d.text}</span>`;
        document.getElementById('messages').appendChild(div); document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    });

    socket.on('user list', list => {
        const uDiv = document.getElementById('users'); uDiv.innerHTML = '';
        list.forEach(u => {
            const i = document.createElement('div'); i.className = 'user-item'; i.style.color = u.color;
            i.innerText = u.nick + (u.nick === "Keyifciyiz_Fm" ? " (Dj)" : "");
            i.onclick = (e) => openAdminMenu(u.nick, e);
            uDiv.appendChild(i);
        });
    });

    function sendMessage(e) { e.preventDefault(); const i = document.getElementById('input'); if(i.value) { socket.emit('chat message', { text: i.value, color: selectedColor, style: styles }); i.value = ''; } }
    function openAdminMenu(t, e) { if (myRole !== 'Yönetici' || t === myNick) return; selectedTarget = t; const m = document.getElementById('custom-menu'); m.style.display = 'block'; m.style.left = e.pageX + "px"; m.style.top = e.pageY + "px"; e.stopPropagation(); }
    document.addEventListener('click', () => { document.getElementById('custom-menu').style.display = 'none'; });
    function changeFontSize(n) { currentFontSize += n; document.getElementById('messages').style.fontSize = currentFontSize + "px"; }
    function toggleStyle(t) { styles[t] = !styles[t]; document.getElementById('btn-'+t).classList.toggle('active'); }
    function changeColor(c) { selectedColor = c; }
    function kickAction() { socket.emit('admin command', {action: 'kick', targetNick: selectedTarget}); }

    // SÜRÜKLENEBİLİR PANEL (DRAGGABLE)
    const mixer = document.getElementById("dj-mixer");
    const dragItem = document.getElementById("mixer-drag");
    let active = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
    dragItem.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("mousemove", drag);
    function dragStart(e) { initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; if (e.target === dragItem) active = true; }
    function dragEnd() { initialX = currentX; initialY = currentY; active = false; }
    function drag(e) { if (active) { e.preventDefault(); currentX = e.clientX - initialX; currentY = e.clientY - initialY; xOffset = currentX; yOffset = currentY; setTranslate(currentX, currentY, mixer); } }
    function setTranslate(xPos, yPos, el) { el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)"; }
</script>
</body>
</html>
