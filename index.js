<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Sohbet Paneli</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1a1a1a; color: #ccc; font-family: Verdana, sans-serif; height: 100vh; display: flex; justify-content: center; align-items: center; transition: 0.3s; }
        
        #login-overlay { position: fixed; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; justify-content: center; align-items: center; }
        #login-box { background: #333; padding: 25px; border-radius: 8px; border: 2px solid #555; text-align: center; width: 300px; }
        .auth-input { width: 100%; padding: 10px; margin: 10px 0; background: #000; color: #fff; border: 1px solid #666; }

        #chat-container { width: 950px; height: 650px; background: #3b3b3b; border: 2px solid #444; display: flex; flex-direction: column; position: relative; transition: all 0.3s ease; }
        
        /* Tam Ekran Modu */
        #chat-container.fullscreen { width: 100vw !important; height: 100vh !important; border: none; }

        #action-bar { background: #4a4a4a; padding: 10px; display: flex; gap: 8px; align-items: center; border-bottom: 2px solid #222; }
        
        .f-btn { background: linear-gradient(#888, #222); color: #fff; border: 1px solid #000; padding: 7px 14px; cursor: pointer; font-size: 11px; font-weight: bold; border-radius: 3px; text-shadow: 1px 1px #000; }
        .f-btn:hover { background: linear-gradient(#999, #333); }
        .f-btn.active { background: #2ecc71; color: #000; text-shadow: none; }

        /* Pencere Kontrol Butonları (Sağ Üst) */
        .win-controls { display: flex; gap: 5px; margin-left: 10px; }
        .win-btn { width: 22px; height: 22px; background: #333; border: 1px solid #555; color: #fff; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }
        .win-btn:hover { background: #555; }

        #main-area { display: flex; flex: 1; overflow: hidden; background: #222; padding: 10px; gap: 10px; }
        #messages { flex: 3; background: #000; padding: 15px; overflow-y: auto; font-size: 14px; color: #fff; border-radius: 4px; }
        #user-sidebar { flex: 1; background: #111; padding: 10px; border: 1px solid #444; overflow-y: auto; border-radius: 4px; }
        
        #emoji-panel { display: none; position: absolute; bottom: 70px; left: 10px; background: #333; border: 2px solid #555; padding: 10px; width: 250px; flex-wrap: wrap; gap: 10px; z-index: 500; }
        .emoji { font-size: 20px; cursor: pointer; }

        form { display: flex; padding: 15px; background: #3b3b3b; gap: 10px; border-top: 1px solid #222; }
        #input { flex: 1; background: #000; color: #fff; border: 1px solid #555; padding: 12px; outline: none; border-radius: 4px; }
    </style>
</head>
<body>

<div id="login-overlay">
    <div id="login-box">
        <h3 style="color:#f1c40f">Sohbet Girişi</h3>
        <input id="nick-in" class="auth-input" placeholder="Nick" oninput="checkAdm(this.value)">
        <div id="adm-p" style="display:none"><input id="pass-in" type="password" class="auth-input" placeholder="Şifre"></div>
        <button class="f-btn" style="width:100%; margin-top:10px; padding:12px;" onclick="join()">ODAYA GİR</button>
        <p id="err" style="color:red; font-size:11px; margin-top:10px;"></p>
    </div>
</div>

<div id="chat-container">
    <div id="action-bar">
        <button class="f-btn" onclick="toggleEmo()">😊 Emojiler</button>
        <button id="btn-bold" class="f-btn" onclick="toggleStyle('bold')">B</button>
        <button id="btn-italic" class="f-btn" onclick="toggleStyle('italic')">I</button>
        <button id="btn-underline" class="f-btn" onclick="toggleStyle('underline')">U</button>
        <input type="color" id="cp" value="#2ecc71" style="width:30px; height:24px; border:none; background:none; cursor:pointer;">
        
        <div style="flex:1"></div>

        <div class="win-controls">
            <button class="win-btn" title="Küçült" onclick="toggleSize('small')">_</button>
            <button class="win-btn" title="Tam Ekran" onclick="toggleSize('full')">□</button>
            <button class="win-btn" style="background:#c0392b" onclick="location.reload()">X</button>
        </div>
    </div>

    <div id="main-area">
        <div id="messages"></div>
        <div id="user-sidebar">
            <b style="color:#f1c40f; font-size:11px;">DİNLEYİCİLER</b>
            <hr style="margin:10px 0; border:0; border-top:1px solid #333;">
            <div id="ulist"></div>
        </div>
    </div>

    <div id="emoji-panel">
        <span class="emoji" onclick="addEmo('😊')">😊</span>
        <span class="emoji" onclick="addEmo('😂')">😂</span>
        <span class="emoji" onclick="addEmo('😉')">😉</span>
        <span class="emoji" onclick="addEmo('😍')">😍</span>
        <span class="emoji" onclick="addEmo('🔥')">🔥</span>
        <span class="emoji" onclick="addEmo('🌹')">🌹</span>
        <span class="emoji" onclick="addEmo('🎵')">🎵</span>
    </div>

    <form onsubmit="send(event)">
        <input id="input" autocomplete="off" placeholder="Mesajınız...">
        <button class="f-btn" style="width:100px;">GÖNDER</button>
    </form>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    var socket = io();
    var myRole = "", myNick = "";
    var styles = { bold: false, italic: false, underline: false };

    function checkAdm(v) { document.getElementById('adm-p').style.display = (v === "Halil") ? "block" : "none"; }
    
    function join() {
        var n = document.getElementById('nick-in').value.trim();
        var p = document.getElementById('pass-in').value.trim();
        if(!n) return;
        socket.emit('join', { nick: n, password: p });
    }

    // Boyut Ayarı Fonksiyonu
    function toggleSize(type) {
        var container = document.getElementById('chat-container');
        if(type === 'full') {
            container.classList.toggle('fullscreen');
        } else if(type === 'small') {
            container.classList.remove('fullscreen');
            container.style.width = "700px";
            container.style.height = "500px";
        }
    }

    socket.on('auth error', (m) => document.getElementById('err').innerText = m);
    socket.on('login success', (d) => { 
        myRole = d.role; myNick = d.nick; 
        document.getElementById('login-overlay').style.display = 'none'; 
    });

    function toggleEmo() {
        var p = document.getElementById('emoji-panel');
        p.style.display = (p.style.display === 'flex') ? 'none' : 'flex';
    }

    function addEmo(e) { document.getElementById('input').value += e; document.getElementById('input').focus(); }

    function toggleStyle(s) {
        styles[s] = !styles[s];
        document.getElementById('btn-' + s).classList.toggle('active');
    }

    function send(e) {
        e.preventDefault();
        var i = document.getElementById('input');
        if(!i.value.trim()) return;
        socket.emit('chat message', { text: i.value, color: document.getElementById('cp').value, style: styles });
        i.value = '';
        document.getElementById('emoji-panel').style.display = 'none';
    }

    socket.on('chat message', (d) => {
        var div = document.createElement('div');
        div.style.marginBottom = "8px";
        if(d.system) div.innerHTML = `<small style="color:#888"><i>${d.text}</i></small>`;
        else {
            var s = d.style || {};
            var styleStr = `color:${d.color}; ${s.bold?'font-weight:bold;':''} ${s.italic?'font-style:italic;':''} ${s.underline?'text-decoration:underline;':''}`;
            var b = (d.role === 'Yönetici') ? `<span style="background:red; color:#fff; font-size:9px; padding:2px 4px; border-radius:2px; margin-right:5px; font-weight:bold;">ADM</span>` : '';
            div.innerHTML = `${b}<b style="color:${d.color}; cursor:pointer" onclick="adm('${d.user}')">${d.user}:</b> <span style="${styleStr}">${d.text}</span>`;
        }
        document.getElementById('messages').appendChild(div);
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    });

    socket.on('user list', (l) => {
        var c = document.getElementById('ulist'); c.innerHTML = '';
        l.forEach(u => { 
            var d = document.createElement('div'); 
            d.style.color = u.color; d.style.fontSize = "13px"; d.style.padding = "3px 0";
            d.innerHTML = (u.role==='Yönetici'?'👑 ':'👤 ')+u.nick; 
            c.appendChild(d); 
        });
    });

    function adm(t) {
        if(myRole !== 'Yönetici' || t === myNick) return;
        var c = prompt(t + " için:\n1: At\n2: Yasakla (IP Ban)");
        if(c === "1") socket.emit('admin command', {action: 'kick', targetNick: t});
        if(c === "2") socket.emit('admin command', {action: 'ban', targetNick: t});
    }

    socket.on('force logout', (m) => { alert(m); location.reload(); });
</script>
</body>
</html>
