const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const createDemoUser = async () => {
    try {
        await connectDB();

        // Check if demo user already exists
        const existingUser = await User.findOne({ email: 'user@demo.com' });

        if (existingUser) {
            console.log('Demo user already exists. 0 created.');
            process.exit(0);
        }

        // Create new demo user
        await User.create({
            name: 'Demo User',
            email: 'user@demo.com',
            password: 'user123',
            phone: '9000000001',
            isAdmin: false
        });

        console.log('Demo user created successfully. 1 created.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating demo user:', error);
        process.exit(1);
    }
};

createDemoUser();

