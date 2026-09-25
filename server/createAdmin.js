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

const createAdmin = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@carparking.com' });
        
        if (existingAdmin) {
            console.log('Admin user already exists. 0 created.');
            process.exit(0);
        }

        // Create new admin user
        await User.create({
            name: 'Admin User',
            email: 'admin@carparking.com',
            password: 'admin123',
            phone: '9999999999',
            isAdmin: true
        });

        console.log('Admin user created successfully. 1 created.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
