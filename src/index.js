const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");

const {
  generateMessage,
  generateLocationMessage
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./utils/users");

const app = express();

// socket creation
const server = http.createServer(app);
const io = socketio(server); // sockets creation requires a raw HTTP server

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", socket => {
  socket.on("join", ({ username, room }, cb) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return cb(error);
    }

    socket.join(user.room);

    // sending messages to everyone in the room
    socket.emit("message", generateMessage("Admin", "Welcome!"));

    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined ${room}`));

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    cb();
  });

  // sending a message
  socket.on("sendMessage", (message, cb) => {
    const filter = new Filter();
    const user = getUser(socket.id); // Get a user

    // Check if the message contains bad words
    if (filter.isProfane(message)) {
      return cb("Profanity is not allowed!");
    } else {
      // Send a message to a room in which the user is located
      io.to(user.room).emit("message", generateMessage(user.username, message));

      // Call callback function
      cb();
    }
  });

  // receive a location
  socket.on("sendLocation", ({ latitude, longitude }, cb) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${latitude},${longitude}`
      )
    );

    cb();
  });

  // disconnection
  socket.on("disconnect", _ => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left`)
      );

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

// Start a server
server.listen(port, _ => console.log(`Server is running on port: ${port}`));
