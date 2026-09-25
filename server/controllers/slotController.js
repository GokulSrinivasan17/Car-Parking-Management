const mongoose = require('mongoose');
const ParkingSlot = require('../models/ParkingSlot');

// ─── @desc  Get all parking slots
// ─── @route GET /api/slots
// ─── @access Public
const getSlots = async (req, res) => {
    try {
        const slots = await ParkingSlot.find({});
        return res.json(slots);
    } catch (error) {
        console.error('getSlots error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve parking slots' });
    }
};

// ─── @desc  Create a parking slot
// ─── @route POST /api/slots
// ─── @access Private/Admin
const createSlot = async (req, res) => {
    try {
        const { slotNumber, floor, zone, type } = req.body;

        // Validation
        if (!slotNumber || !floor || !zone || !type) {
            return res.status(400).json({ message: 'slotNumber, floor, zone, and type are all required' });
        }

        if (!['Car', 'Bike'].includes(type)) {
            return res.status(400).json({ message: 'type must be "Car" or "Bike"' });
        }

        if (typeof floor !== 'number' && isNaN(Number(floor))) {
            return res.status(400).json({ message: 'floor must be a valid number' });
        }

        const slotExists = await ParkingSlot.findOne({ slotNumber: slotNumber.trim() });
        if (slotExists) {
            return res.status(409).json({ message: `Slot "${slotNumber}" already exists` });
        }

        const slot = await ParkingSlot.create({
            slotNumber: slotNumber.trim(),
            floor: Number(floor),
            zone: zone.trim().toUpperCase(),
            type,
        });

        return res.status(201).json(slot);
    } catch (error) {
        console.error('createSlot error:', error.message);
        return res.status(500).json({ message: 'Failed to create parking slot' });
    }
};

// ─── @desc  Update a slot (e.g. status)
// ─── @route PUT /api/slots/:id
// ─── @access Private/Admin
const updateSlot = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid slot ID' });
        }

        const slot = await ParkingSlot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Only allow safe fields to be updated by admin
        if (req.body.status !== undefined) {
            if (!['Available', 'Occupied', 'Maintenance'].includes(req.body.status)) {
                return res.status(400).json({ message: 'status must be "Available", "Occupied", or "Maintenance"' });
            }
            slot.status = req.body.status;
        }

        if (req.body.type !== undefined) {
            if (!['Car', 'Bike'].includes(req.body.type)) {
                return res.status(400).json({ message: 'type must be "Car" or "Bike"' });
            }
            slot.type = req.body.type;
        }

        const updatedSlot = await slot.save();
        return res.json(updatedSlot);
    } catch (error) {
        console.error('updateSlot error:', error.message);
        return res.status(500).json({ message: 'Failed to update slot' });
    }
};

// ─── @desc  Delete a slot
// ─── @route DELETE /api/slots/:id
// ─── @access Private/Admin
const deleteSlot = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid slot ID' });
        }

        const slot = await ParkingSlot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Prevent deletion of an occupied slot
        if (slot.status === 'Occupied') {
            return res.status(409).json({ message: 'Cannot delete a slot that is currently occupied' });
        }

        await slot.deleteOne();
        return res.json({ message: 'Slot removed successfully' });
    } catch (error) {
        console.error('deleteSlot error:', error.message);
        return res.status(500).json({ message: 'Failed to delete slot' });
    }
};

module.exports = { getSlots, createSlot, updateSlot, deleteSlot };
