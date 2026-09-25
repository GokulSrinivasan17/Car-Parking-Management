const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                return res.status(401).json({ message: 'Not authorized, no token' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Validate that the decoded id is a valid ObjectId before querying
            if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
                return res.status(401).json({ message: 'Not authorized, invalid token payload' });
            }

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user no longer exists' });
            }

            return next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, invalid token' });
            }
            console.error('Auth middleware error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Admin-only authorization guard.
 * Must always be used AFTER the protect middleware.
 */
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

module.exports = { protect, admin };
