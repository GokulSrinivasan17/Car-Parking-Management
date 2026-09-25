const mongoose = require('mongoose');

const parkingSlotSchema = mongoose.Schema({
    slotNumber: {
        type: String,
        required: true,
        unique: true
    },
    floor: {
        type: Number,
        required: true
    },
    zone: {
        type: String,
        required: true // e.g., 'A', 'B'
    },
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Maintenance'],
        default: 'Available'
    },
    type: {
        type: String,
        enum: ['Car', 'Bike'], // Vehicle types
        required: true
    },
    basePrice: {
        type: Number,
        required: true,
        default: function() {
            return this.type === 'Car' ? 50 : 20; // Car: ₹50/hr, Bike: ₹20/hr
        }
    },
    pricePerDay: {
        type: Number,
        required: true,
        default: function() {
            return this.type === 'Car' ? 10 : 5; // Additional daily rate
        }
    },
    reservedFor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        default: null
    },
    currentVehicle: {
        vehicleNumber: String,
        vehicleType: String,
        entryTime: Date
    }
}, {
    timestamps: true
});

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);
module.exports = ParkingSlot;
