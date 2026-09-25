const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');

// Pricing Constants
const PRICING = {
    Car: {
        basePrice: 50,      // Base price for car (first day)
        pricePerDay: 10     // After first day
    },
    Bike: {
        basePrice: 20,      // Base price for bike (first day)
        pricePerDay: 5      // After first day
    }
};

// ─── Helper: Validate booking ObjectId param ─────────────────────────────────
const validateBookingId = (id, res) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid booking ID' });
        return false;
    }
    return true;
};

// ─── @desc  Create a new booking request
// ─── @route POST /api/bookings
// ─── @access Private
const createBooking = async (req, res) => {
    try {
        const { slotId, vehicleNumber, vehicleType, vehicleModel, ownerName, phoneNumber, requestedDuration } = req.body;

        // Validation
        if (!slotId || !vehicleNumber || !vehicleType || !ownerName || !phoneNumber) {
            return res.status(400).json({ message: 'Please provide all required fields: slotId, vehicleNumber, vehicleType, ownerName, phoneNumber' });
        }

        if (!mongoose.Types.ObjectId.isValid(slotId)) {
            return res.status(400).json({ message: 'Invalid slot ID' });
        }

        if (!['Car', 'Bike'].includes(vehicleType)) {
            return res.status(400).json({ message: 'vehicleType must be "Car" or "Bike"' });
        }

        const duration = Number(requestedDuration);
        if (!Number.isInteger(duration) || duration < 1 || duration > 30) {
            return res.status(400).json({ message: 'requestedDuration must be a whole number between 1 and 30' });
        }

        const vehicleNumberTrimmed = vehicleNumber.trim().toUpperCase();
        if (!/^[A-Z0-9-]{2,15}$/.test(vehicleNumberTrimmed)) {
            return res.status(400).json({ message: 'Invalid vehicle number format' });
        }

        const slot = await ParkingSlot.findById(slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        if (slot.status !== 'Available') {
            return res.status(409).json({ message: 'Slot is not available for booking' });
        }

        // Check if slot type matches vehicle type
        if (slot.type !== vehicleType) {
            return res.status(400).json({ message: `This slot is designated for ${slot.type} only` });
        }

        // Check if this user already has an active/pending booking for this slot
        const duplicateBooking = await Booking.findOne({
            user: req.user._id,
            slot: slotId,
            status: { $in: ['Pending', 'Active'] }
        });
        if (duplicateBooking) {
            return res.status(409).json({ message: 'You already have an active or pending booking for this slot' });
        }

        // Calculate estimated amount (per day billing)
        const pricing = PRICING[vehicleType];
        const baseAmount = pricing.basePrice;
        const additionalAmount = duration > 1 ? (duration - 1) * pricing.pricePerDay : 0;
        const estimatedTotal = baseAmount + additionalAmount;

        // Generate unique ticket number
        const ticketNumber = `TKT${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        const booking = await Booking.create({
            user: req.user._id,
            slot: slotId,
            vehicleNumber: vehicleNumberTrimmed,
            vehicleType,
            vehicleModel: vehicleModel ? vehicleModel.trim() : '',
            ownerName: ownerName.trim(),
            phoneNumber: phoneNumber.trim(),
            requestedDuration: duration,
            baseAmount,
            additionalAmount,
            totalAmount: estimatedTotal,
            status: 'Pending',
            requestTime: new Date(),
            ticketNumber
        });

        const populatedBooking = await Booking.findById(booking._id)
            .populate('slot')
            .populate('user', 'name email phone');

        return res.status(201).json(populatedBooking);
    } catch (error) {
        console.error('createBooking error:', error.message);
        return res.status(500).json({ message: 'Failed to create booking' });
    }
};

// ─── @desc  Approve a booking request
// ─── @route PUT /api/bookings/:id/approve
// ─── @access Private/Admin
const approveBooking = async (req, res) => {
    try {
        if (!validateBookingId(req.params.id, res)) return;

        const booking = await Booking.findById(req.params.id).populate('slot');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot approve a booking with status: ${booking.status}` });
        }

        // Check if slot is still available
        const slot = await ParkingSlot.findById(booking.slot._id);
        if (!slot) {
            return res.status(404).json({ message: 'Associated slot not found' });
        }

        if (slot.status !== 'Available') {
            booking.status = 'Rejected';
            booking.rejectionReason = 'Slot is no longer available';
            await booking.save();
            return res.status(409).json({ message: 'Slot is no longer available; booking has been auto-rejected' });
        }

        // Approve and activate
        booking.status = 'Active';
        booking.startTime = new Date();
        booking.approvedBy = req.user._id;
        booking.approvalTime = new Date();
        await booking.save();

        // Mark slot as Occupied
        slot.status = 'Occupied';
        slot.reservedFor = booking._id;
        slot.currentVehicle = {
            vehicleNumber: booking.vehicleNumber,
            vehicleType: booking.vehicleType,
            entryTime: new Date()
        };
        await slot.save();

        const populatedBooking = await Booking.findById(booking._id)
            .populate('slot')
            .populate('user', 'name email phone')
            .populate('approvedBy', 'name email');

        return res.json(populatedBooking);
    } catch (error) {
        console.error('approveBooking error:', error.message);
        return res.status(500).json({ message: 'Failed to approve booking' });
    }
};

// ─── @desc  Reject a booking request
// ─── @route PUT /api/bookings/:id/reject
// ─── @access Private/Admin
const rejectBooking = async (req, res) => {
    try {
        if (!validateBookingId(req.params.id, res)) return;

        const { reason } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'Pending') {
            return res.status(400).json({ message: 'Can only reject pending bookings' });
        }

        booking.status = 'Rejected';
        booking.rejectionReason = reason ? reason.trim() : 'No reason provided';
        booking.approvedBy = req.user._id;
        booking.approvalTime = new Date();
        await booking.save();

        const populatedBooking = await Booking.findById(booking._id)
            .populate('slot')
            .populate('user', 'name email phone')
            .populate('approvedBy', 'name email');

        return res.json(populatedBooking);
    } catch (error) {
        console.error('rejectBooking error:', error.message);
        return res.status(500).json({ message: 'Failed to reject booking' });
    }
};

// ─── @desc  Get logged in user bookings
// ─── @route GET /api/bookings/mybookings
// ─── @access Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('slot')
            .sort({ createdAt: -1 });
        return res.json(bookings);
    } catch (error) {
        console.error('getMyBookings error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve bookings' });
    }
};

// ─── @desc  Get all bookings (Admin)
// ─── @route GET /api/bookings
// ─── @access Private/Admin
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('slot')
            .populate('user', 'name email phone')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 });
        return res.json(bookings);
    } catch (error) {
        console.error('getAllBookings error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve all bookings' });
    }
};

// ─── @desc  End a booking (Exit) - Calculate final amount
// ─── @route PUT /api/bookings/:id/end
// ─── @access Private
const endBooking = async (req, res) => {
    try {
        if (!validateBookingId(req.params.id, res)) return;

        const booking = await Booking.findById(req.params.id).populate('slot');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'Active') {
            return res.status(400).json({ message: 'Only active bookings can be ended' });
        }

        // Verify user owns booking or is admin
        if (booking.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to end this booking' });
        }

        const endTime = new Date();
        const startTime = new Date(booking.startTime);

        // Calculate actual duration in days (rounded up, minimum 1 day)
        const durationMs = endTime - startTime;
        const actualDurationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

        // Calculate final amount based on actual duration (per day billing)
        const pricing = PRICING[booking.vehicleType];
        const baseAmount = pricing.basePrice;
        const additionalDays = Math.max(0, actualDurationDays - 1);
        const additionalAmount = additionalDays * pricing.pricePerDay;
        const totalAmount = baseAmount + additionalAmount;

        // Check if exceeded requested duration
        const overtime = actualDurationDays > booking.requestedDuration;

        booking.endTime = endTime;
        booking.actualDuration = actualDurationDays;
        booking.baseAmount = baseAmount;
        booking.additionalAmount = additionalAmount;
        booking.totalAmount = totalAmount;
        booking.status = 'Completed';
        await booking.save();

        // Free up the slot
        const slot = await ParkingSlot.findById(booking.slot._id);
        if (slot) {
            slot.status = 'Available';
            slot.reservedFor = null;
            slot.currentVehicle = {};
            await slot.save();
        }

        const populatedBooking = await Booking.findById(booking._id)
            .populate('slot')
            .populate('user', 'name email phone');

        return res.json({
            ...populatedBooking.toObject(),
            overtime,
            message: overtime
                ? `Overtime charges applied! You parked for ${actualDurationDays} day(s) (requested ${booking.requestedDuration} day(s))`
                : 'Thank you for using our parking service!'
        });
    } catch (error) {
        console.error('endBooking error:', error.message);
        return res.status(500).json({ message: 'Failed to end booking session' });
    }
};

// ─── @desc  Get pending bookings (Admin)
// ─── @route GET /api/bookings/pending
// ─── @access Private/Admin
const getPendingBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'Pending' })
            .populate('slot')
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });
        return res.json(bookings);
    } catch (error) {
        console.error('getPendingBookings error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve pending bookings' });
    }
};

// ─── @desc  Get active bookings (Currently parked vehicles)
// ─── @route GET /api/bookings/active
// ─── @access Private
const getActiveBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'Active' })
            .populate('slot')
            .populate('user', 'name email phone')
            .sort({ startTime: -1 });
        return res.json(bookings);
    } catch (error) {
        console.error('getActiveBookings error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve active bookings' });
    }
};

// ─── @desc  Get booking statistics (Admin)
// ─── @route GET /api/bookings/stats
// ─── @access Private/Admin
const getBookingStats = async (req, res) => {
    try {
        const [
            totalBookings,
            pendingBookings,
            activeBookings,
            completedBookings,
            rejectedBookings,
            totalRevenue,
            todayRevenue
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Pending' }),
            Booking.countDocuments({ status: 'Active' }),
            Booking.countDocuments({ status: 'Completed' }),
            Booking.countDocuments({ status: 'Rejected' }),
            Booking.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Booking.aggregate([
                {
                    $match: {
                        status: 'Completed',
                        endTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        return res.json({
            totalBookings,
            pendingBookings,
            activeBookings,
            completedBookings,
            rejectedBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            todayRevenue: todayRevenue[0]?.total || 0
        });
    } catch (error) {
        console.error('getBookingStats error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve booking statistics' });
    }
};

// ─── @desc  Cancel a pending booking request (User)
// ─── @route PUT /api/bookings/:id/cancel
// ─── @access Private
const cancelBooking = async (req, res) => {
    try {
        if (!validateBookingId(req.params.id, res)) return;

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Ensure the authenticated user owns the booking, or is an admin
        if (booking.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        if (booking.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot cancel a booking with status: ${booking.status}` });
        }

        booking.status = 'Cancelled';
        await booking.save();

        // Ensure associated slot is marked Available
        if (booking.slot) {
            const slot = await ParkingSlot.findById(booking.slot);
            if (slot && slot.status !== 'Available') {
                slot.status = 'Available';
                slot.reservedFor = null;
                slot.currentVehicle = {};
                await slot.save();
            }
        }

        const populatedBooking = await Booking.findById(booking._id)
            .populate('slot')
            .populate('user', 'name email phone');

        return res.json(populatedBooking);
    } catch (error) {
        console.error('cancelBooking error:', error.message);
        return res.status(500).json({ message: 'Failed to cancel booking' });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    endBooking,
    approveBooking,
    rejectBooking,
    getAllBookings,
    getPendingBookings,
    getActiveBookings,
    getBookingStats,
    cancelBooking
};
