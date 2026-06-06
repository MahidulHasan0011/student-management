const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server);

  io.on("connection", (socket) => {
    console.log("user connected");
  });
};

const getIO = () => io;

module.exports = { initSocket, getIO };