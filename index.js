const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let users = {};

app.use(express.static(__dirname));

io.on('connection', socket => {

  socket.on('join', username => {
    users[socket.id] = username;
    io.emit('users', Object.values(users));
  });

  socket.on('message', msg => {
    io.emit('message', {
      user: users[socket.id],
      text: msg,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('users', Object.values(users));
  });
});

http.listen(3000, () => console.log('Server çalışıyor'));
