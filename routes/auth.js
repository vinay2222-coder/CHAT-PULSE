const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware"); // Optional: if you create a separate middleware

router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Required fields missing" });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(400).json({ error: "Username already taken" });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: "Invalid username or password" });
    }
    const token = jwt.sign({ username }, process.env.JWT_SECRET);
    res.json({ token });
});

router.get("/profile", async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Get token from header
        if (!token) return res.status(401).json({ error: "Access denied" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find user and exclude password from the result
        const user = await User.findOne({ username: decoded.username }).select("-password");
        
        res.json(user);
    } catch (err) {
        res.status(401).json({ error: "Invalid session" });
    }
});

module.exports = router;