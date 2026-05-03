let isLoginMode = false;
let currentUser = null;

// Başlangıçta admin hesabı tanımlayalım (Test için)
if(!localStorage.getItem("admin")) {
    localStorage.setItem("admin", JSON.stringify({pass: "1234", role: "yönetici"}));
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Giriş Yap" : "Kayıt Ol";
    document.getElementById('main-auth-btn').innerText = isLoginMode ? "Giriş Yap" : "Kayıt Ol";
    document.getElementById('toggle-link').innerText = isLoginMode ? "Hesabın yok mu? Kayıt Ol" : "Zaten hesabım var";
}

function handleAuth() {
    const nick = document.getElementById('nick-input').value;
    const pass = document.getElementById('pass-input').value;

    if(!nick || !pass) return alert("Boş alan bırakmayın!");

    if(!isLoginMode) {
        // KAYIT
        if(localStorage.getItem(nick)) return alert("Bu nick zaten alınmış!");
        localStorage.setItem(nick, JSON.stringify({pass: pass, role: "kullanıcı"}));
        alert("Kayıt başarılı! Giriş yapabilirsiniz.");
        toggleAuthMode();
    } else {
        // GİRİŞ
        const userData = JSON.parse(localStorage.getItem(nick));
        if(userData && userData.pass === pass) {
            currentUser = { nick: nick, role: userData.role };
            loginSuccess();
        } else {
            alert("Hatalı nick veya şifre!");
        }
    }
}

function loginSuccess() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    document.getElementById('user-display').innerText = `Hoş geldin, ${currentUser.nick} (${currentUser.role})`;
    updateUserList();
}

function updateUserList() {
    const userListDiv = document.getElementById('online-users');
    // Örnek kullanıcılar (Normalde sunucudan gelir)
    const onlineMock = [
        {nick: "KaragüL", role: "yönetici"},
        {nick: "DJ_Aysima", role: "dj"},
        {nick: currentUser.nick, role: currentUser.role}
    ];

    userListDiv.innerHTML = '<h4>Online Dostlar</h4>';
    onlineMock.forEach(user => {
        let adminButtons = "";
        
        // Eğer giriş yapan kişi YÖNETİCİ ise butonları göster
        if(currentUser.role === "yönetici" && user.nick !== currentUser.nick) {
            adminButtons = `
                <span class="admin-controls">
                    <b class="btn-kick" onclick="adminAction('at', '${user.nick}')">[At]</b>
                    <b class="btn-dj" onclick="adminAction('dj', '${user.nick}')">[DJ Yap]</b>
                </span>
            `;
        }

        userListDiv.innerHTML += `<div><strong>${user.nick}</strong> <small>(${user.role})</small> ${adminButtons}</div>`;
    });
}

function adminAction(action, target) {
    if(action === 'at') {
        alert(target + " odadan atıldı!");
    } else if(action === 'dj') {
        alert(target + " artık DJ yetkisine sahip!");
    }
}

function sendMessage() {
    const msg = document.getElementById('msg-input').value;
    if(!msg) return;
    const msgDiv = document.getElementById('messages');
    msgDiv.innerHTML += `<div><strong>${currentUser.nick}:</strong> ${msg}</div>`;
    document.getElementById('msg-input').value = "";
    msgDiv.scrollTop = msgDiv.scrollHeight;
}
