const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    socket.join(roomId);

    const otherUser = rooms[roomId].find(id => id !== socket.id);
    if (otherUser) {
      socket.emit("other-user", otherUser);
      socket.to(otherUser).emit("user-joined", socket.id);
    }
  });

  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  socket.on("ice-candidate", (payload) => {
    io.to(payload.target).emit("ice-candidate", payload);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});

server.listen(5004, "0.0.0.0", () => console.log("Backend running on port 5004"));
