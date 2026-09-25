const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, createBooking).get(protect, admin, getAllBookings);
router.route('/mybookings').get(protect, getMyBookings);
router.route('/pending').get(protect, admin, getPendingBookings);
router.route('/active').get(protect, getActiveBookings);
router.route('/stats').get(protect, admin, getBookingStats);
router.route('/:id/end').put(protect, endBooking);
router.route('/:id/cancel').put(protect, cancelBooking);
router.route('/:id/approve').put(protect, admin, approveBooking);
router.route('/:id/reject').put(protect, admin, rejectBooking);

module.exports = router;

