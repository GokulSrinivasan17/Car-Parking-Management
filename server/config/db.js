const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error('FATAL: MONGO_URI is not set. Cannot connect to database.');
        process.exit(1);
    }

    try {
        let conn;
        try {
            conn = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 4000, // Fail fast if Atlas server can't be reached
            });
        } catch (primaryErr) {
            console.warn(`Primary MongoDB connection failed (${primaryErr.message}). Attempting local fallback...`);
            conn = await mongoose.connect(process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/carparking', {
                serverSelectionTimeoutMS: 4000,
            });
        }

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle unexpected disconnection after initial connect
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected.');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err.message);
        });

    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
