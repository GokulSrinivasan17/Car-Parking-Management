const express = require('express');
const router = express.Router();
const { getSlots, createSlot, updateSlot, deleteSlot } = require('../controllers/slotController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getSlots).post(protect, admin, createSlot);
router.route('/:id').put(protect, admin, updateSlot).delete(protect, admin, deleteSlot);

module.exports = router;
