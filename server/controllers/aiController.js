const { generateChatResponse, AIError } = require('../services/aiService');
const { retrieveRelevantFAQ } = require('../services/faqService');
const {
    extractIntentAndEntities,
    validateAndMergeBookingIntent,
    buildBookingConversationalResponse,
    extractFromText
} = require('../services/intentService');
const {
    checkAvailableSlots,
    executeAvailabilityWithGemini,
    executeCreateBooking,
    calculateBookingPrice,
    setPendingBooking,
    getPendingBooking,
    clearPendingBooking,
    setPendingCancellation,
    getPendingCancellation,
    clearPendingCancellation,
    detectConfirmationIntent,
    cancelBookingTool,
    getMyBookingsTool,
    resolveNaturalDate
} = require('../services/parkingTools');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_LENGTH = 20;
const MAX_HISTORY_ITEM_LENGTH = 2000;

/**
 * Validates request payload for /api/ai/chat.
 * Returns null if valid, or an error message string if invalid.
 */
const validateChatInput = (body) => {
    if (!body || typeof body !== 'object') {
        return 'Request body must be a JSON object.';
    }

    const { message, history } = body;

    // Validate current message
    if (message === undefined || message === null) {
        return 'Message is required.';
    }

    if (typeof message !== 'string') {
        return 'Message must be a text string.';
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
        return 'Message cannot be empty.';
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
        return `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`;
    }

    // Validate optional history
    if (history !== undefined && history !== null) {
        if (!Array.isArray(history)) {
            return 'History must be an array of messages.';
        }

        if (history.length > MAX_HISTORY_LENGTH) {
            return `History exceeds maximum limit of ${MAX_HISTORY_LENGTH} messages.`;
        }

        for (let i = 0; i < history.length; i++) {
            const item = history[i];
            if (!item || typeof item !== 'object') {
                return `History item at index ${i} is not a valid object.`;
            }

            const validRoles = ['user', 'assistant', 'model'];
            if (!item.role || typeof item.role !== 'string' || !validRoles.includes(item.role.toLowerCase())) {
                return `History item at index ${i} must have role 'user' or 'assistant'.`;
            }

            if (item.content === undefined || typeof item.content !== 'string') {
                return `History item at index ${i} must have valid string content.`;
            }

            if (item.content.length > MAX_HISTORY_ITEM_LENGTH) {
                return `History message at index ${i} exceeds maximum length of ${MAX_HISTORY_ITEM_LENGTH} characters.`;
            }
        }
    }

    // Check for prototype pollution or NoSQL injection attempts in top-level keys
    for (const key of Object.keys(body)) {
        if (key.includes('__proto__') || key.includes('constructor') || key.includes('prototype') || key.startsWith('$')) {
            return 'Invalid request parameter.';
        }
    }

    // Validate optional bookingContext
    if (body.bookingContext !== undefined && body.bookingContext !== null) {
        if (typeof body.bookingContext !== 'object' || Array.isArray(body.bookingContext)) {
            return 'bookingContext must be a valid JSON object.';
        }
    }

    return null;
};

/**
 * Sanitizes untrusted client-supplied bookingContext.
 * Strips prototype pollution, NoSQL operators, and authority-sensitive fields
 * (such as userId, ownerName, phoneNumber, confirmed, price, status, etc.).
 *
 * @param {Object} rawContext
 * @returns {Object|null}
 */
const sanitizeBookingContext = (rawContext) => {
    if (!rawContext || typeof rawContext !== 'object' || Array.isArray(rawContext)) {
        return null;
    }

    const clean = Object.create(null);
    const ALLOWED_TOP_KEYS = ['intent', 'confidence', 'details', 'missingDetails', 'awaitingField'];
    const ALLOWED_DETAIL_KEYS = ['vehicleType', 'vehicleNumber', 'vehicleModel', 'date', 'duration', 'startTime', 'slotNumber'];

    for (const key of Object.keys(rawContext)) {
        if (key.includes('__proto__') || key.includes('constructor') || key.includes('prototype') || key.startsWith('$')) {
            continue;
        }

        if (key === 'details' && rawContext.details && typeof rawContext.details === 'object' && !Array.isArray(rawContext.details)) {
            clean.details = Object.create(null);
            for (const dKey of Object.keys(rawContext.details)) {
                if (dKey.includes('__proto__') || dKey.includes('constructor') || dKey.includes('prototype') || dKey.startsWith('$')) {
                    continue;
                }
                if (ALLOWED_DETAIL_KEYS.includes(dKey)) {
                    const val = rawContext.details[dKey];
                    if (typeof val === 'string') {
                        clean.details[dKey] = val.slice(0, 100).replace(/[${}]/g, '');
                    } else if (typeof val === 'number' && Number.isFinite(val)) {
                        clean.details[dKey] = val;
                    }
                }
            }
        } else if (ALLOWED_TOP_KEYS.includes(key)) {
            const val = rawContext[key];
            if (typeof val === 'string') {
                clean[key] = val.slice(0, 100).replace(/[${}]/g, '');
            } else if (typeof val === 'boolean') {
                clean[key] = val;
            } else if (typeof val === 'number' && Number.isFinite(val)) {
                clean[key] = val;
            } else if (key === 'missingDetails' && Array.isArray(val)) {
                clean.missingDetails = val
                    .filter(item => typeof item === 'string' && ALLOWED_DETAIL_KEYS.includes(item))
                    .slice(0, 10);
            }
        }
    }

    return Object.keys(clean).length > 0 ? clean : null;
};

/**
 * POST /api/ai/chat
 * Handles conversational queries with ParkSmart AI shell.
 */
const chatWithAI = async (req, res) => {
    try {
        const validationError = validateChatInput(req.body);
        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const { message, history = [], bookingContext: rawBookingContext = null } = req.body;
        const bookingContext = sanitizeBookingContext(rawBookingContext);
        const user = req.user;
        const confirmationIntent = detectConfirmationIntent(message);

        // =========================================================================
        // PRIORITY 1: Explicit confirmation/cancellation/modification of pending actions
        // =========================================================================

        // 1A. Pending Cancellation Gate
        const pendingCancel = user ? getPendingCancellation(user._id) : null;
        if (pendingCancel) {
            if (confirmationIntent === 'confirm') {
                const cancelResult = await cancelBookingTool(pendingCancel.bookingId, user);
                clearPendingCancellation(user._id);

                if (cancelResult.success) {
                    return res.status(200).json({
                        success: true,
                        message: `Your booking **${pendingCancel.ticketNumber}** has been cancelled successfully.`,
                        bookingIntent: {
                            intent: 'cancellation_confirmed',
                            booking: cancelResult.booking
                        }
                    });
                } else {
                    return res.status(200).json({
                        success: true,
                        message: cancelResult.message || `Unable to cancel booking ${pendingCancel.ticketNumber}.`,
                        bookingIntent: {
                            intent: 'cancellation_failed',
                            error: cancelResult.message
                        }
                    });
                }
            } else if (confirmationIntent === 'cancel') {
                clearPendingCancellation(user._id);
                return res.status(200).json({
                    success: true,
                    message: `No problem. Your booking **${pendingCancel.ticketNumber}** has not been cancelled.`,
                    bookingIntent: { intent: 'cancellation_aborted' }
                });
            } else {
                // If user asked an FAQ or another question while awaiting cancellation confirmation:
                const faqContext = retrieveRelevantFAQ(message, history);
                if (faqContext && !message.toLowerCase().includes('cancel')) {
                    const faqResponse = await generateChatResponse(message, history, faqContext);
                    return res.status(200).json({
                        success: true,
                        message: `${faqResponse}\n\n*(Note: You have a pending cancellation for booking **${pendingCancel.ticketNumber}**. Would you like to confirm cancellation?)*`,
                        bookingIntent: { intent: 'faq' }
                    });
                }
            }
        }

        // 1B. Pending Booking Gate
        const pending = user ? getPendingBooking(user._id) : null;
        if (pending) {
            // Case A: User explicitly confirms booking creation
            if (confirmationIntent === 'confirm') {
                const createResult = await executeCreateBooking({}, user);

                if (createResult.success) {
                    const b = createResult.booking;
                    const replyText = `Your booking has been created successfully!\n\n` +
                        `- **Ticket Number:** ${b.ticketNumber}\n` +
                        `- **Slot:** ${b.slotNumber}\n` +
                        `- **Vehicle:** ${b.vehicleType} (${b.vehicleNumber})\n` +
                        `- **Date:** ${b.date}\n` +
                        `- **Duration:** ${b.duration} day${b.duration > 1 ? 's' : ''}\n` +
                        `- **Status:** ${b.status}\n` +
                        `- **Total Amount:** ₹${b.totalAmount}\n\n` +
                        `You can view your booking from your Driver Dashboard (/dashboard).`;

                    return res.status(200).json({
                        success: true,
                        message: replyText,
                        bookingIntent: {
                            intent: 'booking_confirmed',
                            booking: b
                        }
                    });
                } else if (createResult.slotUnavailable) {
                    return res.status(200).json({
                        success: true,
                        message: createResult.message,
                        bookingIntent: {
                            intent: 'booking_failed',
                            reason: createResult.message
                        }
                    });
                } else {
                    return res.status(200).json({
                        success: true,
                        message: createResult.message,
                        bookingIntent: {
                            intent: 'booking_error',
                            reason: createResult.message
                        }
                    });
                }
            }

            // Case B: User declines or cancels pending booking
            if (confirmationIntent === 'cancel') {
                clearPendingBooking(user._id);
                return res.status(200).json({
                    success: true,
                    message: "No problem. I haven't created the booking. Let me know if you need anything else!",
                    bookingIntent: {
                        intent: 'booking_cancelled'
                    }
                });
            }

            // Case C: User says "Any slot is fine" (Section 18, TEST 9)
            if (confirmationIntent === 'any_slot') {
                const checkRes = await checkAvailableSlots({
                    vehicleType: pending.vehicleType,
                    date: pending.date,
                    duration: pending.duration
                });

                if (checkRes.available && checkRes.slots && checkRes.slots.length > 0) {
                    const chosenSlot = checkRes.slots[0];
                    const slotDoc = await ParkingSlot.findOne({ slotNumber: chosenSlot.slotNumber });
                    const price = calculateBookingPrice(pending.vehicleType, pending.duration);

                    setPendingBooking(user._id, {
                        ...pending,
                        slotId: slotDoc ? slotDoc._id : chosenSlot._id,
                        slotNumber: chosenSlot.slotNumber,
                        estimatedTotal: price
                    });

                    const summary = `Here's your booking:\n\n` +
                        `Vehicle: ${pending.vehicleType}\n` +
                        `Vehicle No: ${pending.vehicleNumber}\n` +
                        `Date: ${pending.date}\n` +
                        `Duration: ${pending.duration} day${pending.duration > 1 ? 's' : ''}\n` +
                        `Slot: ${chosenSlot.slotNumber}\n` +
                        `Estimated amount: ₹${price}\n\n` +
                        `Would you like me to confirm this booking?`;

                    return res.status(200).json({
                        success: true,
                        message: summary,
                        bookingIntent: {
                            intent: 'booking_pending_confirmation',
                            details: { ...pending, slotNumber: chosenSlot.slotNumber, estimatedTotal: price }
                        }
                    });
                } else {
                    return res.status(200).json({
                        success: true,
                        message: `Sorry, there are no available ${pending.vehicleType} slots for ${pending.date}.`,
                        bookingIntent: { intent: 'booking_failed' }
                    });
                }
            }

            // Case D: User modifies slot, duration, or date before confirmation (Sections 13-16)
            if (confirmationIntent === 'modify') {
                let updatedSlot = pending.slotNumber;
                let updatedDur = pending.duration;
                let updatedDate = pending.date;

                // Check slot change (e.g. "choose B1-01", "give me B1-01")
                const slotMatch = message.match(/(?:slot|give me|choose|to)\s*([A-Za-z]\d+(?:-\d+)?)\b/i) ||
                                  message.match(/\b([A-Za-z]\d+(?:-\d+)?)\b/);
                if (slotMatch) {
                    const candidate = slotMatch[1].toUpperCase();
                    if (!/days?/i.test(candidate) && !['TN', 'DL', 'MH', 'KA', 'KL', 'HR', 'UP', 'WB', 'TS', 'AP'].includes(candidate)) {
                        updatedSlot = candidate;
                    }
                }

                // Check duration change (e.g. "make it 3 days", "actually 3 days", "for a week")
                if (/\b(?:for\s+)?(?:a|one|1)\s*week\b/i.test(message)) {
                    updatedDur = 7;
                } else {
                    const durMatch = message.match(/(?:make it|for|need it for|duration)?\s*(\d+)\s*days?\b/i);
                    if (durMatch) {
                        updatedDur = parseInt(durMatch[1], 10);
                    }
                }

                // Check date change (e.g. "make it Saturday", "actually tomorrow")
                const parsedDate = resolveNaturalDate(message);
                if (parsedDate) {
                    updatedDate = parsedDate;
                }

                // Check availability with updated parameters
                const checkRes = await checkAvailableSlots({
                    slotNumber: updatedSlot,
                    date: updatedDate,
                    duration: updatedDur,
                    vehicleType: pending.vehicleType
                });

                if (checkRes.available) {
                    const newSlotObj = checkRes.slot || (checkRes.slots && checkRes.slots[0]);
                    const newSlotDoc = await ParkingSlot.findOne({ slotNumber: newSlotObj.slotNumber });
                    const newPrice = calculateBookingPrice(pending.vehicleType, updatedDur);

                    setPendingBooking(user._id, {
                        ...pending,
                        slotId: newSlotDoc ? newSlotDoc._id : pending.slotId,
                        slotNumber: newSlotObj.slotNumber,
                        date: updatedDate,
                        duration: updatedDur,
                        estimatedTotal: newPrice
                    });

                    const summary = `Here's your booking:\n\n` +
                        `Vehicle: ${pending.vehicleType}\n` +
                        `Vehicle No: ${pending.vehicleNumber}\n` +
                        `Date: ${updatedDate}\n` +
                        `Duration: ${updatedDur} day${updatedDur > 1 ? 's' : ''}\n` +
                        `Slot: ${newSlotObj.slotNumber}\n` +
                        `Estimated amount: ₹${newPrice}\n\n` +
                        `Would you like me to confirm this booking?`;

                    return res.status(200).json({
                        success: true,
                        message: summary,
                        bookingIntent: {
                            intent: 'booking_pending_confirmation',
                            details: {
                                ...pending,
                                slotNumber: newSlotObj.slotNumber,
                                date: updatedDate,
                                duration: updatedDur,
                                estimatedTotal: newPrice
                            }
                        }
                    });
                } else {
                    const failMsg = checkRes.reason || `Slot ${updatedSlot} is currently unavailable for ${updatedDate}. Would you like to keep slot ${pending.slotNumber} or choose another slot?`;
                    return res.status(200).json({
                        success: true,
                        message: failMsg,
                        bookingIntent: {
                            intent: 'booking_pending_confirmation',
                            details: pending
                        }
                    });
                }
            }

            // Case E: If user asked a non-confirmation question (e.g. FAQ), let it proceed to FAQ or remind them
            if (confirmationIntent === 'none' && !/^(maybe|ok|okay\?)/i.test(message.trim())) {
                const faqContext = retrieveRelevantFAQ(message, history);
                if (faqContext && !message.toLowerCase().includes('book') && !message.toLowerCase().includes('confirm')) {
                    const responseMessage = await generateChatResponse(message, history, faqContext);
                    return res.status(200).json({
                        success: true,
                        message: `${responseMessage}\n\n*(Note: You have a pending reservation for slot **${pending.slotNumber}** (${pending.vehicleType}) on ${pending.date} for ₹${pending.estimatedTotal}. Would you like me to confirm this booking?)*`,
                        bookingIntent: { intent: 'faq' }
                    });
                }
            }

            // If message is not a new booking request, remind user of pending confirmation
            if (!/\b(book|reserve|park|need parking)\b/i.test(message)) {
                return res.status(200).json({
                    success: true,
                    message: `Here's your booking:\n\n` +
                        `Vehicle: ${pending.vehicleType}\n` +
                        `Vehicle No: ${pending.vehicleNumber}\n` +
                        `Date: ${pending.date}\n` +
                        `Duration: ${pending.duration} day${pending.duration > 1 ? 's' : ''}\n` +
                        `Slot: ${pending.slotNumber}\n` +
                        `Estimated amount: ₹${pending.estimatedTotal}\n\n` +
                        `Would you like me to confirm this booking?`,
                    bookingIntent: {
                        intent: 'booking_pending_confirmation',
                        details: pending
                    }
                });
            }
        }

        // 1C. User confirms when no pending booking exists (TEST 19 duplicate confirmation check)
        if (confirmationIntent === 'confirm') {
            return res.status(200).json({
                success: true,
                message: "No pending booking was found to confirm. Please tell me your vehicle type, date, and duration to start a booking request.",
                bookingIntent: { intent: 'general' }
            });
        }

        // =========================================================================
        // PRIORITY 2: Extract Intent and Fallback Entities
        // =========================================================================
        const rawExtracted = await extractIntentAndEntities(message, history);
        const fallbackText = extractFromText(message);

        // Resolve active intent with priority
        let activeIntent = rawExtracted.intent || fallbackText.intent || 'general';
        if (fallbackText.intent && ['booking_history', 'cancellation', 'booking'].includes(fallbackText.intent)) {
            activeIntent = fallbackText.intent;
        }

        // =========================================================================
        // PRIORITY 3: Booking History Intent (getMyBookings)
        // =========================================================================
        if (activeIntent === 'booking_history') {
            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: "Please log in to view your bookings.",
                    bookingIntent: { intent: 'booking_history', authRequired: true }
                });
            }

            const historyResult = await getMyBookingsTool(user);
            if (!historyResult.success) {
                return res.status(200).json({
                    success: true,
                    message: historyResult.message || "Failed to retrieve your bookings.",
                    bookingIntent: { intent: 'booking_history' }
                });
            }

            if (historyResult.bookings.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "You don't have any bookings yet. Would you like to reserve a parking slot?",
                    bookingIntent: { intent: 'booking_history', bookings: [] }
                });
            }

            let replyText = "Here are your recent ParkSmart bookings:\n\n";
            historyResult.bookings.forEach((b, idx) => {
                replyText += `${idx + 1}. **${b.ticketNumber}**\n` +
                    `   - **Slot:** ${b.slotNumber}\n` +
                    `   - **Vehicle:** ${b.vehicleType} (${b.vehicleNumber})\n` +
                    `   - **Date:** ${b.date}\n` +
                    `   - **Duration:** ${b.duration} day${b.duration > 1 ? 's' : ''}\n` +
                    `   - **Status:** ${b.status}\n` +
                    `   - **Amount:** ₹${b.amount}\n\n`;
            });

            return res.status(200).json({
                success: true,
                message: replyText.trim(),
                bookingIntent: {
                    intent: 'booking_history',
                    bookings: historyResult.bookings
                }
            });
        }

        // =========================================================================
        // PRIORITY 4: Cancellation Intent (cancelBooking)
        // =========================================================================
        if (activeIntent === 'cancellation') {
            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: "Please log in to manage your bookings.",
                    bookingIntent: { intent: 'cancellation', authRequired: true }
                });
            }

            // Look for ticket number in message (e.g. TKT12345)
            const ticketMatch = message.match(/TKT[A-Z0-9]+/i);
            const requestedTicket = ticketMatch ? ticketMatch[0].toUpperCase() : null;

            // Query user's pending bookings (only Pending can be cancelled)
            const pendingBookings = await Booking.find({ user: user._id, status: 'Pending' })
                .populate('slot')
                .sort({ createdAt: -1 });

            if (requestedTicket) {
                const targetBooking = pendingBookings.find(b => b.ticketNumber.toUpperCase() === requestedTicket);
                if (targetBooking) {
                    setPendingCancellation(user._id, {
                        bookingId: targetBooking._id.toString(),
                        ticketNumber: targetBooking.ticketNumber,
                        slotNumber: targetBooking.slot ? targetBooking.slot.slotNumber : 'N/A'
                    });
                    return res.status(200).json({
                        success: true,
                        message: `I found your booking **${targetBooking.ticketNumber}** for slot **${targetBooking.slot ? targetBooking.slot.slotNumber : 'N/A'}**.\n\nAre you sure you want to cancel it?`,
                        bookingIntent: {
                            intent: 'cancellation_pending_confirmation',
                            ticketNumber: targetBooking.ticketNumber
                        }
                    });
                } else {
                    // Check if booking exists under another status or another user
                    const anyUserBooking = await Booking.findOne({ user: user._id, ticketNumber: requestedTicket });
                    if (anyUserBooking) {
                        return res.status(200).json({
                            success: true,
                            message: `Booking **${requestedTicket}** has status '${anyUserBooking.status}'. Only bookings with status 'Pending' can be cancelled. Active sessions must be ended at checkout.`,
                            bookingIntent: { intent: 'cancellation_rejected' }
                        });
                    } else {
                        return res.status(200).json({
                            success: true,
                            message: `Booking **${requestedTicket}** was not found in your account or you are not authorized to cancel it.`,
                            bookingIntent: { intent: 'cancellation_rejected' }
                        });
                    }
                }
            }

            // No specific ticket provided
            if (pendingBookings.length === 0) {
                const anyBooking = await Booking.findOne({ user: user._id });
                if (anyBooking) {
                    return res.status(200).json({
                        success: true,
                        message: "You do not have any pending bookings that can be cancelled. Active bookings cannot be cancelled; they must be ended at checkout.",
                        bookingIntent: { intent: 'cancellation_none' }
                    });
                }
                return res.status(200).json({
                    success: true,
                    message: "You do not have any bookings to cancel.",
                    bookingIntent: { intent: 'cancellation_none' }
                });
            }

            if (pendingBookings.length === 1) {
                const b = pendingBookings[0];
                setPendingCancellation(user._id, {
                    bookingId: b._id.toString(),
                    ticketNumber: b.ticketNumber,
                    slotNumber: b.slot ? b.slot.slotNumber : 'N/A'
                });
                return res.status(200).json({
                    success: true,
                    message: `I found your booking **${b.ticketNumber}** for slot **${b.slot ? b.slot.slotNumber : 'N/A'}**.\n\nAre you sure you want to cancel it?`,
                    bookingIntent: {
                        intent: 'cancellation_pending_confirmation',
                        ticketNumber: b.ticketNumber
                    }
                });
            }

            // Multiple pending bookings: list them
            let prompt = "You have multiple pending bookings. Which one would you like to cancel? Please specify the ticket number:\n\n";
            pendingBookings.forEach((b, i) => {
                prompt += `${i + 1}. Ticket **${b.ticketNumber}** (Slot ${b.slot ? b.slot.slotNumber : 'N/A'})\n`;
            });
            return res.status(200).json({
                success: true,
                message: prompt.trim(),
                bookingIntent: { intent: 'cancellation_multiple' }
            });
        }

        // =========================================================================
        // PRIORITY 5: Active Booking Flow (Conversational multi-turn)
        // =========================================================================
        const isBookingContextActive = bookingContext && (bookingContext.intent === 'booking' || bookingContext.awaitingField);
        if (activeIntent === 'booking' || isBookingContextActive) {
            // Require authentication for booking flow
            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: "Please log in to your ParkSmart account before I can create a booking.",
                    bookingIntent: {
                        intent: 'booking',
                        authRequired: true
                    }
                });
            }

            const validatedBooking = validateAndMergeBookingIntent(rawExtracted, bookingContext || {}, user, message);

            // Validation error (e.g. duration > 30 days, invalid plate, past date, unsupported vehicle)
            if (validatedBooking.validationIssues.length > 0) {
                const replyText = buildBookingConversationalResponse(validatedBooking);
                return res.status(200).json({
                    success: true,
                    message: replyText,
                    bookingIntent: validatedBooking
                });
            }

            // Missing required details (one question at a time)
            if (validatedBooking.missingDetails.length > 0) {
                const replyText = buildBookingConversationalResponse(validatedBooking);
                return res.status(200).json({
                    success: true,
                    message: replyText,
                    bookingIntent: validatedBooking
                });
            }

            // All booking details complete! Check real availability and propose confirmation
            const reqSlot = validatedBooking.details.slotNumber;
            const reqDate = validatedBooking.details.date;
            const reqDur = validatedBooking.details.duration || 1;
            const reqType = validatedBooking.details.vehicleType;

            let targetSlot = null;
            if (reqSlot) {
                const checkRes = await checkAvailableSlots({
                    slotNumber: reqSlot,
                    date: reqDate,
                    duration: reqDur,
                    vehicleType: reqType
                });
                if (!checkRes.available) {
                    const failReply = checkRes.reason || `Slot ${reqSlot} is currently unavailable for ${reqDate}. Would you like to check other available ${reqType} slots?`;
                    return res.status(200).json({
                        success: true,
                        message: failReply,
                        bookingIntent: {
                            ...validatedBooking,
                            slotAvailability: checkRes
                        }
                    });
                }
                targetSlot = checkRes.slot || (checkRes.slots && checkRes.slots[0]);
            } else {
                const checkRes = await checkAvailableSlots({
                    date: reqDate,
                    duration: reqDur,
                    vehicleType: reqType
                });
                if (!checkRes.available || !checkRes.slots || checkRes.slots.length === 0) {
                    return res.status(200).json({
                        success: true,
                        message: `Sorry, no available ${reqType} parking slots were found for ${reqDate}. Would you like to check another date?`,
                        bookingIntent: {
                            ...validatedBooking,
                            slotAvailability: checkRes
                        }
                    });
                }
                targetSlot = checkRes.slots[0];
            }

            // Look up slot in database
            const slotDoc = await ParkingSlot.findOne({ slotNumber: targetSlot.slotNumber });
            if (!slotDoc) {
                return res.status(200).json({
                    success: true,
                    message: `Slot ${targetSlot.slotNumber} could not be resolved. Please try another slot.`,
                    bookingIntent: validatedBooking
                });
            }

            // Calculate estimated total price
            const estimatedTotal = calculateBookingPrice(reqType, reqDur);

            // Store pending confirmation state associated with user
            setPendingBooking(user._id, {
                slotId: slotDoc._id,
                slotNumber: slotDoc.slotNumber,
                vehicleType: reqType,
                vehicleNumber: validatedBooking.details.vehicleNumber,
                vehicleModel: validatedBooking.details.vehicleModel || '',
                date: reqDate,
                duration: reqDur,
                estimatedTotal,
                ownerName: user.name || validatedBooking.details.ownerName,
                phoneNumber: user.phone || validatedBooking.details.phoneNumber
            });

            // Concise booking summary and prompt user for EXPLICIT confirmation (Section 20)
            const summaryPrompt = `Here's your booking:\n\n` +
                `Vehicle: ${reqType}\n` +
                `Vehicle No: ${validatedBooking.details.vehicleNumber}\n` +
                `Date: ${reqDate}\n` +
                `Duration: ${reqDur} day${reqDur > 1 ? 's' : ''}\n` +
                `Slot: ${slotDoc.slotNumber}\n` +
                `Estimated amount: ₹${estimatedTotal}\n\n` +
                `Would you like me to confirm this booking?`;

            return res.status(200).json({
                success: true,
                message: summaryPrompt,
                bookingIntent: {
                    ...validatedBooking,
                    pendingConfirmation: true,
                    details: {
                        ...validatedBooking.details,
                        slotNumber: slotDoc.slotNumber,
                        estimatedTotal
                    }
                }
            });
        }

        // =========================================================================
        // PRIORITY 6: Live Parking Availability Tool (Phase 5A)
        // =========================================================================
        if (activeIntent === 'availability') {
            const availResult = await executeAvailabilityWithGemini(message, history, bookingContext);

            return res.status(200).json({
                success: true,
                message: availResult.reply,
                bookingIntent: {
                    intent: 'availability',
                    details: {
                        vehicleType: availResult.toolArgs?.vehicleType || rawExtracted.vehicleType || null,
                        date: availResult.toolArgs?.date || rawExtracted.date || null,
                        duration: availResult.toolArgs?.duration || rawExtracted.duration || null,
                        slotNumber: availResult.toolArgs?.slotNumber || rawExtracted.slotNumber || null
                    },
                    toolCalled: availResult.toolCalled,
                    available: availResult.toolResult ? availResult.toolResult.available : null,
                    slots: availResult.toolResult?.slots || []
                }
            });
        }

        // =========================================================================
        // PRIORITY 7 & 8: FAQ & General Conversation via Knowledge Engine
        // =========================================================================
        const faqContext = retrieveRelevantFAQ(message, history);
        const responseMessage = await generateChatResponse(message, history, faqContext);

        return res.status(200).json({
            success: true,
            message: responseMessage,
            bookingIntent: { intent: activeIntent || 'general' }
        });
    } catch (err) {
        if (err instanceof AIError || err.name === 'AIError' || err.statusCode) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }

        console.error('chatWithAI uncaught error:', err.message);
        // Generic safe error response - never expose internal stack or secrets
        return res.status(500).json({
            success: false,
            message: 'Unable to process your request.'
        });
    }
};

module.exports = {
    chatWithAI
};
