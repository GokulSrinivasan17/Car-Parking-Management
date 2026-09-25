const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── @desc  Auth user & get token
// ─── @route POST /api/auth/login
// ─── @access Public
const authUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Backend validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            phone: user.phone,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ message: 'Server error during login' });
    }
};

// ─── @desc  Register a new user
// ─── @route POST /api/auth/register
// ─── @access Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Backend validation
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'All fields are required: name, email, password, phone' });
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.toLowerCase().trim();
        const trimmedPhone = phone.trim();

        if (trimmedName.length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters' });
        }

        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        if (!/^\d{10}$/.test(trimmedPhone)) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
        }

        const userExists = await User.findOne({ email: trimmedEmail });
        if (userExists) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        const user = await User.create({
            name: trimmedName,
            email: trimmedEmail,
            password,
            phone: trimmedPhone,
        });

        if (user) {
            return res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                phone: user.phone,
                token: generateToken(user._id),
            });
        }

        return res.status(400).json({ message: 'Invalid user data' });
    } catch (error) {
        console.error('Register error:', error.message);
        return res.status(500).json({ message: 'Server error during registration' });
    }
};

module.exports = { authUser, registerUser };
