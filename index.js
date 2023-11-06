const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Store user nicknames and online status in objects
const users = {};

io.on('connection', (socket) => {
  socket.on('set nickname', (nickname) => {
    // Store the user's nickname
    users[socket.id] = { nickname, online: true };
    updateOnlineUsers();
  });

  socket.on('chat message', (msg) => {
    // Get the user's nickname
    const { nickname } = users[socket.id] || { nickname: 'Anonymous' };

    // Emit an object containing message and sender nickname
    io.emit('chat message', { message: msg, sender: nickname });
  });

  socket.on('typing', () => {
    // Notify other users that the user is typing
    socket.broadcast.emit('user is typing', users[socket.id].nickname);
  });

  socket.on('stopped typing', () => {
    // Notify other users that the user stopped typing
    socket.broadcast.emit('user stopped typing', users[socket.id].nickname);
  });

  socket.on('disconnect', () => {
    // Mark the user as offline
    if (users[socket.id]) {
      users[socket.id].online = false;
      updateOnlineUsers();
      delete users[socket.id];
    }
  });

  function updateOnlineUsers() {
    // Create an array of online users
    const onlineUsers = Object.keys(users)
      .filter((userId) => users[userId].online)
      .map((userId) => users[userId].nickname);

    // Emit the online user list to all clients
    io.emit('online users', onlineUsers);
  }
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
