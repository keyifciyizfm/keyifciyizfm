const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let users = [];

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Radyo Chat</title>

<style>
body {
  background:#0f172a;
  color:white;
  font-family:Arial;
}

#chat {
  height:300px;
  overflow:auto;
  border:1px solid #444;
  padding:10px;
  margin-bottom:10px;
}

input {
  padding:6px;
  margin:5px;
}

button {
  padding:6px 12px;
  background:#22c55e;
  border:none;
  color:white;
  cursor:pointer;
}

#users {
  background:#1e293b;
  padding:10px;
  margin-top:10px;
}
</style>

</head>

<body>

<h2>🎧 Radyo Chat</h2>

<input id="isim" placeholder="Adın">
<button onclick="gir()">Giriş</button>

<div id="chat"></div>

<input id="mesaj" placeholder="Mesaj">
<button onclick="gonder()">Gönder</button>

<h3>👥 Online</h3>
<ul id="users"></ul>

<script src="/socket.io/socket.io.js"></script>
<script>

const socket = io();
let isim = "";

function gir(){
  isim = document.getElementById("isim").value;
  socket.emit("kullanici", isim);
}

function gonder(){
  let mesaj = document.getElementById("mesaj").value;
  socket.emit("mesaj", isim + ": " + mesaj);
}

// MESAJ GÖSTER
socket.on("mesaj", (data)=>{
  document.getElementById("chat").innerHTML += 
  "<div style='background:#1e293b;padding:8px;margin:5px;border-radius:10px;'>"+data+"</div>";
});

// KULLANICI LİSTESİ
socket.on("kullanicilar", (users)=>{
  let html = "";

  users.forEach(u=>{

    let renk = "white";
    let etiket = "";

    if(u.rol == "admin"){
      renk = "red";
      etiket = " 👑";
    }

    if(u.rol == "dj"){
      renk = "orange";
      etiket = " 🎧";
    }

    if(u.canli){
      etiket += " 🔴CANLI";
    }

    html += "<li style='color:"+renk+"'>"+u.isim+etiket+"</li>";
  });

  document.getElementById("users").innerHTML = html;
});

</script>

</body>
</html>
  `);
});

// KULLANICI GİRİŞ
io.on("connection", (socket) => {

  socket.on("kullanici", (isim) => {

    let rol = "user";

    if(isim.toLowerCase() == "halil"){
      rol = "admin";
    }

    if(isim.toLowerCase() == "gamze"){
      rol = "dj";
    }

    let user = {
      id: socket.id,
      isim: isim,
      rol: rol,
      canli: false
    };

    users.push(user);
    io.emit("kullanicilar", users);
  });

  // MESAJ
  socket.on("mesaj", (data) => {
    io.emit("mesaj", data);
  });

  // DJ CANLI AÇMA
  socket.on("canli", () => {
    let user = users.find(u => u.id === socket.id);
    if(user && user.rol === "dj"){
      user.canli = true;
      io.emit("kullanicilar", users);
    }
  });

  // ÇIKIŞ
  socket.on("disconnect", () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit("kullanicilar", users);
  });

});

http.listen(process.env.PORT || 3000);
