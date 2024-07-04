import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Message } from "./message.schema.js";
import { User } from "./user.schema.js";
import { connectToDB } from "./db.config.js";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// app.use(express.static("public"));
// const connectedUsers = new Set();

// function generateSessionToken() {
//   return Math.random().toString(36).substr(2) + Date.now().toString(36);
// }

io.on("connection", async (socket) => {
  console.log("New user connected");

  socket.on("join", async (username) => {
    try {
      let user = await User.findOneAndUpdate(
        { username },
        { connected: true },
        { new: true, upsert: true }
      );

      socket.userId = user._id;
      socket.username = username;
      console.log(user);
      io.emit("user-joined", {
        username: socket.username,
        users: await getConnectedUsers(),
      });
      loadChatHistory(socket);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("message", async (message) => {
    try {
      const msg = new Message({ username: socket.username, message });
      await msg.save();
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      io.emit("message", { username: socket.username, message, currentTime });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("typing", () => {
    socket.broadcast.emit("typing", socket.username);
  });
  socket.on("stop-typing", () => {
    socket.broadcast.emit("stop-typing");
  });

  socket.on("disconnect", async () => {
    const userId = socket.userId;
    if (userId) {
      await User.findOneAndUpdate(
        { username: socket.username },
        { connected: false }
      );
      io.emit("user-disconnected", {
        username: socket.username,
        users: await getConnectedUsers(),
      });
    }
  });
});

async function loadChatHistory(socket) {
  try {
    const messages = await Message.find().sort("timestamp");
    const formattedMessages = messages.map((msg) => ({
      username: msg.username,
      message: msg.message,
      timestamp: msg.timestamp.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
    }));
    socket.emit("chat-history", formattedMessages);
  } catch (err) {
    console.error(err);
  }
}
async function getConnectedUsers() {
  const users = await User.find({ connected: true });
  return users.map((user) => user.username);
}

server.listen(3000, () => {
  console.log(`Server running on port 3000`);
  connectToDB();
});
