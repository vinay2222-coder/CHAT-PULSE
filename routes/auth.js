const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
    try {
        // 1. Only get username and password from the frontend
        const { username, password } = req.body; 
        
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username taken" });

        // 2. Create user without the email field
        const newUser = new User({ username, password });
        await newUser.save();

        // 3. Create the token
        const token = jwt.sign(
            { username: newUser.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, username: newUser.username });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({ token, username: user.username });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;