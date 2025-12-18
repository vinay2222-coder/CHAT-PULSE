require('dotenv').config();
const express = require("express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", authRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

const users = {};   // socket.id -> username
const sockets = {}; // username -> Set of socket.ids

// Socket.io Middleware for Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Authentication error"));
        socket.user = decoded;
        next();
    });
});

io.on("connection", (socket) => {
    const username = socket.user.username;
    users[socket.id] = username;

    if (!sockets[username]) sockets[username] = new Set();
    sockets[username].add(socket.id);

    // Broadcast updated online list to all clients
    io.emit("users", [...new Set(Object.values(users))]);

    // Update: Make this function async to use 'await'
    socket.on("privateMessage", async (data) => {
        const { toUser, text } = data;
        
        // 1. Save message to Database immediately
        const newMessage = new Message({
            sender: username,
            receiver: toUser,
            text: text
        });
        await newMessage.save();

        // 2. Send to recipient if they are online
        const targetIds = sockets[toUser];
        if (targetIds) {
            targetIds.forEach(id => {
                io.to(id).emit("privateMessage", { fromUser: username, text });
            });
        }
    });

    // 3. New Listener: Send old messages when a user clicks a contact
    socket.on("getChatHistory", async (otherUser) => {
        const history = await Message.find({
            $or: [
                { sender: username, receiver: otherUser },
                { sender: otherUser, receiver: username }
            ]
        }).sort({ timestamp: 1 }); // Sort by time (oldest to newest)
        
        socket.emit("chatHistory", history);
    });

    // Inside io.on("connection")
socket.on("typing", (data) => {
    const targetIds = sockets[data.toUser];
    if (targetIds) {
        targetIds.forEach(id => {
            io.to(id).emit("typing", { fromUser: username });
        });
    }
});
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server http://localhost:3000/ ${PORT}`));