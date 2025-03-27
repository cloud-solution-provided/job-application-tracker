const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            email,
            password,
            profile: { name }
        });

        await user.save();

        // Start session
        req.session.userId = user._id;

        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Start session
        req.session.userId = user._id;

        res.json({
            user: {
                id: user._id,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Logout
router.post('/logout', isAuthenticated, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user
router.get('/me', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data' });
    }
});

// Update profile
router.patch('/profile', isAuthenticated, async (req, res) => {
    try {
        const updates = {};
        const allowedUpdates = ['name', 'title', 'location', 'skills'];
        
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[`profile.${key}`] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: 'Error updating profile', error: error.message });
    }
});

module.exports = router; 