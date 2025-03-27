const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Please log in to continue' });
        }

        // Get user from database
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Authentication error', error: error.message });
    }
};

module.exports = {
    isAuthenticated
}; 