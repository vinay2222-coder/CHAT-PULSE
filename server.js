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

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

//Path routes for HTML files
//Html routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat.html')));

//API Routes
app.use("/api/auth", authRoutes);

//MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));

// State management
const users = {};   // socket.id -> username
const sockets = {}; // username -> Set of socket.ids

//Socket.io for real-time communication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: No token provided"));
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Authentication error: Invalid token"));
        socket.user = decoded; 
        next();
    });
});

// Socket.io Connection Handling
io.on("connection", (socket) => {
    const username = socket.user.username;
    
    //Store user connection
    users[socket.id] = username;
    if (!sockets[username]) sockets[username] = new Set();
    sockets[username].add(socket.id);

    console.log(`User Connected: ${username} (${socket.id})`);

    //Update and send user list to all clients
    const sendUserList = () => {
        const onlineUsers = [...new Set(Object.values(users))];
        io.emit("users", onlineUsers);
    };
    
    sendUserList();

    //This handles private messages between users
    socket.on("privateMessage", async (data) => {
        const { toUser, text } = data;
        try {
            const newMessage = new Message({
                sender: username,
                receiver: toUser,
                text: text
            });
            await newMessage.save();

            const targetIds = sockets[toUser];
            if (targetIds) {
                targetIds.forEach(id => {
                    io.to(id).emit("privateMessage", { fromUser: username, text });
                });
            }
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    //Handle Chat History
    socket.on("getChatHistory", async (otherUser) => {
        try {
            const history = await Message.find({
                $or: [
                    { sender: username, receiver: otherUser },
                    { sender: otherUser, receiver: username }
                ]
            }).sort({ timestamp: 1 });
            
            socket.emit("chatHistory", history);
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    });

    //Handle Typing Status
    socket.on("typing", (data) => {
        const targetIds = sockets[data.toUser];
        if (targetIds) {
            targetIds.forEach(id => {
                io.to(id).emit("typing", { fromUser: username });
            });
        }
    });

    //Maintain user list on disconnect
    socket.on("disconnect", () => {
        console.log(`Bye ${username}`);
        
        //Remove from users map
        delete users[socket.id];
        
        //Remove from sockets set
        if (sockets[username]) {
            sockets[username].delete(socket.id);
            if (sockets[username].size === 0) {
                delete sockets[username];
            }
        }
        
        //Send updated list so people disappear when they log out
        sendUserList();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});