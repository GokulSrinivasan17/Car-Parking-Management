const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    slot: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'ParkingSlot'
    },
    vehicleNumber: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    vehicleType: {
        type: String,
        enum: ['Car', 'Bike'],
        required: true
    },
    vehicleModel: {
        type: String,
        trim: true
    },
    ownerName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    requestTime: {
        type: Date,
        default: Date.now
    },
    requestedDuration: {
        type: Number, // in hours
        required: true,
        default: 1
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    actualDuration: {
        type: Number, // in hours (calculated)
        default: 0
    },
    baseAmount: {
        type: Number,
        default: 0
    },
    additionalAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0.0
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Active', 'Completed', 'Cancelled', 'Rejected'],
        default: 'Pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvalTime: {
        type: Date
    },
    rejectionReason: {
        type: String
    },
    ticketNumber: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
