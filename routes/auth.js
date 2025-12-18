const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure this path matches your file structure

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // 1. Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username taken" });

        // 2. Save new user
        const newUser = new User({ username, password, email });
        await newUser.save();

        // 3. CREATE THE TOKEN (This fixes the ReferenceError)
        const token = jwt.sign(
            { username: newUser.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // 4. Send response
        res.status(201).json({ token, username: newUser.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating user" });
    }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        // Simple password check (Note: In production, use bcrypt to compare hashes)
        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // CREATE THE TOKEN HERE TOO
        const token = jwt.sign(
            { username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({ token, username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;