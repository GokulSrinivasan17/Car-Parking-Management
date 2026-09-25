const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ParkingSlot = require('./models/ParkingSlot');

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

const createSlots = async () => {
    try {
        await connectDB();

        // Check existing slots to prevent duplicates and preserve existing data
        const existingSlots = await ParkingSlot.find({}, 'slotNumber');
        const existingSlotSet = new Set(existingSlots.map(s => s.slotNumber));
        console.log(`Existing slots in Atlas: ${existingSlots.length}`);

        const slots = [];

        // Create 25 Car slots and 25 Bike slots
        // Floor 1 - Zone A (7 car slots)
        for (let i = 1; i <= 7; i++) {
            slots.push({
                slotNumber: `A1-${i.toString().padStart(2, '0')}`,
                floor: 1,
                zone: 'A',
                type: 'Car',
                status: 'Available',
                basePrice: 50,
                pricePerDay: 10
            });
        }

        // Floor 1 - Zone B (6 car slots)
        for (let i = 1; i <= 6; i++) {
            slots.push({
                slotNumber: `B1-${i.toString().padStart(2, '0')}`,
                floor: 1,
                zone: 'B',
                type: 'Car',
                status: 'Available',
                basePrice: 50,
                pricePerDay: 10
            });
        }

        // Floor 2 - Zone A (6 car slots)
        for (let i = 1; i <= 6; i++) {
            slots.push({
                slotNumber: `A2-${i.toString().padStart(2, '0')}`,
                floor: 2,
                zone: 'A',
                type: 'Car',
                status: 'Available',
                basePrice: 50,
                pricePerDay: 10
            });
        }

        // Floor 2 - Zone B (6 car slots)
        for (let i = 1; i <= 6; i++) {
            slots.push({
                slotNumber: `B2-${i.toString().padStart(2, '0')}`,
                floor: 2,
                zone: 'B',
                type: 'Car',
                status: 'Available',
                basePrice: 50,
                pricePerDay: 10
            });
        }

        // Floor 1 - Zone C (13 bike slots)
        for (let i = 1; i <= 13; i++) {
            slots.push({
                slotNumber: `C1-${i.toString().padStart(2, '0')}`,
                floor: 1,
                zone: 'C',
                type: 'Bike',
                status: 'Available',
                basePrice: 20,
                pricePerDay: 5
            });
        }

        // Floor 2 - Zone C (12 bike slots)
        for (let i = 1; i <= 12; i++) {
            slots.push({
                slotNumber: `C2-${i.toString().padStart(2, '0')}`,
                floor: 2,
                zone: 'C',
                type: 'Bike',
                status: 'Available',
                basePrice: 20,
                pricePerDay: 5
            });
        }

        // Filter out any slots that already exist
        const newSlots = slots.filter(s => !existingSlotSet.has(s.slotNumber));

        if (newSlots.length === 0) {
            console.log(`All ${slots.length} parking slots already exist. 0 new slots created.`);
            process.exit(0);
        }

        // Insert only new slots
        const createdSlots = await ParkingSlot.insertMany(newSlots);
        console.log(`Successfully created ${createdSlots.length} new parking slots (${existingSlots.length} already existed).`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating slots:', error.message);
        process.exit(1);
    }
};

createSlots();
