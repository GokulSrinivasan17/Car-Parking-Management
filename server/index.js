const dns = require('dns');
// Ensure IPv4 is prioritized to prevent getaddrinfo ENOTFOUND on networks with IPv6 issues
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

// ─── Environment validation ──────────────────────────────────────────────────
if (!process.env.MONGO_URI) {
    console.error('FATAL: MONGO_URI is not defined in environment variables. Exiting.');
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not defined in environment variables. Exiting.');
    process.exit(1);
}

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiRoutes = require('./routes/aiRoutes');

// ─── Connect to database ──────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    'https://parksmart-parking.vercel.app'
];

// Always allow configured CLIENT_URL
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

// Allow localhost for development (CRA default ports)
if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000');
    allowedOrigins.push('http://127.0.0.1:3000');
}

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// ─── Security Headers Middleware ──────────────────────────────────────────────
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        status: 'OK',
        dbState: states[mongoose.connection.readyState] || 'unknown',
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const isDev = process.env.NODE_ENV !== 'production';

    // CORS errors
    if (err.message && err.message.startsWith('CORS:')) {
        return res.status(403).json({ message: err.message });
    }

    // JSON parse error (e.g. malformed body from express.json)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Malformed JSON payload in request body' });
    }

    // Log the full error server-side safely
    console.error('[ERROR]', err.message || err);

    const status = err.statusCode || err.status || 500;
    // Mask internal server errors in both dev and prod to prevent sensitive schema/stack leakage
    const message = status >= 500 ? 'Internal Server Error' : err.message;

    res.status(status).json({ message });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
