const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const { optionalProtect } = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/ai/chat
 * @desc    Send a conversational message to ParkSmart AI shell
 * @access  Public / Optional Authenticated (Rate limited: 30 req/min)
 */
router.post('/chat', aiRateLimiter, optionalProtect, chatWithAI);

module.exports = router;

