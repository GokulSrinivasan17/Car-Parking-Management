const mongoose = require('mongoose');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const { createBookingRecord, PRICING } = require('../controllers/bookingController');

/**
 * Gemini Function Declaration for checkAvailableSlots
 */
const CHECK_AVAILABLE_SLOTS_TOOL = {
    functionDeclarations: [{
        name: 'checkAvailableSlots',
        description: 'Check real ParkSmart parking slot availability for a requested vehicle type, date, duration, and optionally a specific slot.',
        parameters: {
            type: 'OBJECT',
            properties: {
                vehicleType: {
                    type: 'STRING',
                    enum: ['Car', 'Bike'],
                    description: 'Vehicle type: Car or Bike.'
                },
                date: {
                    type: 'STRING',
                    description: 'Start date in YYYY-MM-DD format (must be today or in the future in Asia/Kolkata timezone).'
                },
                duration: {
                    type: 'INTEGER',
                    description: 'Number of days to park (integer between 1 and 30).'
                },
                slotNumber: {
                    type: 'STRING',
                    description: 'Optional specific slot identifier (e.g. A1, A1-01, B1-02).'
                }
            },
            required: ['date']
        }
    }]
};

/**
 * Gemini Function Declaration for createBooking
 * Note: Authentication, pricing, owner details, and status are authoritative on the backend.
 */
const CREATE_BOOKING_TOOL = {
    functionDeclarations: [{
        name: 'createBooking',
        description: 'Create a confirmed parking slot booking in ParkSmart after explicit user confirmation.',
        parameters: {
            type: 'OBJECT',
            properties: {
                vehicleType: {
                    type: 'STRING',
                    enum: ['Car', 'Bike'],
                    description: 'Vehicle type: Car or Bike.'
                },
                vehicleNumber: {
                    type: 'STRING',
                    description: 'Registration plate number (e.g. TN38AB1234).'
                },
                vehicleModel: {
                    type: 'STRING',
                    description: 'Optional vehicle model (e.g. Honda City).'
                },
                date: {
                    type: 'STRING',
                    description: 'Booking start date in YYYY-MM-DD format.'
                },
                duration: {
                    type: 'INTEGER',
                    description: 'Duration in days (1 to 30).'
                },
                slotNumber: {
                    type: 'STRING',
                    description: 'Confirmed slot identifier (e.g. A1-03, B1-01).'
                }
            },
            required: ['vehicleType', 'vehicleNumber', 'date', 'duration', 'slotNumber']
        }
    }]
};

/**
 * Returns today's date in Asia/Kolkata timezone (YYYY-MM-DD).
 */
const getTodayDateIST = () => {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(now);
    } catch {
        return new Date().toISOString().split('T')[0];
    }
};

const WEEKDAYS = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
};

/**
 * Resolves natural language date expressions into canonical YYYY-MM-DD in Asia/Kolkata (IST).
 * Handles: today, tomorrow, day after tomorrow, this Friday, next Monday, Saturday, ISO strings, etc.
 * Returns null if the expression cannot be safely parsed.
 *
 * @param {string} text
 * @param {string} referenceDateIST - Optional reference date (default: today IST)
 * @returns {string|null} Canonical YYYY-MM-DD or null
 */
const resolveNaturalDate = (text, referenceDateIST = null) => {
    if (!text || typeof text !== 'string') return null;
    const cleanText = text.trim().toLowerCase();
    const todayStr = referenceDateIST || getTodayDateIST();
    const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
    const baseDate = new Date(Date.UTC(tYear, tMonth - 1, tDay, 12, 0, 0));

    // 1. Direct keywords
    if (cleanText === 'today' || cleanText.includes('today')) {
        return todayStr;
    }
    if (cleanText === 'day after tomorrow' || cleanText.includes('day after tomorrow')) {
        const d = new Date(baseDate);
        d.setUTCDate(d.getUTCDate() + 2);
        return d.toISOString().split('T')[0];
    }
    if (cleanText === 'tomorrow' || cleanText.includes('tomorrow')) {
        const d = new Date(baseDate);
        d.setUTCDate(d.getUTCDate() + 1);
        return d.toISOString().split('T')[0];
    }

    // 2. Explicit YYYY-MM-DD
    const isoMatch = cleanText.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (isoMatch) {
        return isoMatch[1];
    }

    // 3. Weekday expressions e.g. "this Friday", "next Monday", "Saturday"
    const weekdayMatch = cleanText.match(/\b(?:(this|next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (weekdayMatch) {
        const modifier = weekdayMatch[1] ? weekdayMatch[1].toLowerCase() : null;
        const dayName = weekdayMatch[2].toLowerCase();
        const targetWeekday = WEEKDAYS[dayName];
        const currentWeekday = baseDate.getUTCDay();

        let diff = (targetWeekday - currentWeekday + 7) % 7;
        if (modifier === 'next') {
            diff = diff === 0 ? 7 : diff + 7;
        } else {
            if (diff === 0) {
                diff = 7;
            }
        }
        const d = new Date(baseDate);
        d.setUTCDate(d.getUTCDate() + diff);
        return d.toISOString().split('T')[0];
    }

    // 4. Formats like "27 Sep 2026", "27 September 2026"
    const parsedTimestamp = Date.parse(cleanText);
    if (!isNaN(parsedTimestamp)) {
        const d = new Date(parsedTimestamp);
        return d.toISOString().split('T')[0];
    }

    return null;
};

/**
 * Validates availability input parameters.
 * Backend authority: Never trust LLM parameters blindly.
 *
 * @param {Object} rawParams
 * @returns {Object} { isValid, cleanParams, error }
 */
const validateAvailabilityInput = (rawParams = {}) => {
    const today = getTodayDateIST();
    const clean = {};

    // 1. Validate vehicleType (optional if slotNumber provided, but must be 'Car' or 'Bike' if present)
    if (rawParams.vehicleType) {
        const vt = String(rawParams.vehicleType).trim().toLowerCase();
        if (vt === 'car' || vt.includes('car') || vt.includes('four') || vt.includes('sedan') || vt.includes('suv')) {
            clean.vehicleType = 'Car';
        } else if (vt === 'bike' || vt.includes('bike') || vt.includes('two') || vt.includes('motorcycle') || vt.includes('scooter')) {
            clean.vehicleType = 'Bike';
        } else {
            return {
                isValid: false,
                error: `Vehicle type '${rawParams.vehicleType}' is not supported. ParkSmart supports only 'Car' and 'Bike'.`
            };
        }
    }

    // 2. Validate date (Required, YYYY-MM-DD, >= today)
    let rawDate = String(rawParams.date || '').trim();
    if (!rawDate) {
        return {
            isValid: false,
            error: 'A booking start date is required to check parking availability.'
        };
    }

    // Resolve natural language date expressions
    const resolvedDate = resolveNaturalDate(rawDate, today);
    if (resolvedDate) {
        rawDate = resolvedDate;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        return {
            isValid: false,
            error: `Invalid date format '${rawDate}'. Please provide a valid date in YYYY-MM-DD format.`
        };
    }

    if (rawDate < today) {
        return {
            isValid: false,
            error: `Requested date (${rawDate}) is in the past. Date must be today (${today}) or in the future.`
        };
    }

    // Upper bound on booking date: prevent arbitrary distant future dates (max 365 days)
    const [reqY, reqM, reqD] = rawDate.split('-').map(Number);
    const reqTimestamp = Date.UTC(reqY, reqM - 1, reqD);
    const maxFuture = new Date();
    maxFuture.setFullYear(maxFuture.getFullYear() + 1);
    if (reqTimestamp > maxFuture.getTime()) {
        return {
            isValid: false,
            error: `Requested date (${rawDate}) cannot be more than 1 year in the future.`
        };
    }
    clean.date = rawDate;

    // 3. Validate duration (1 to 30 days)
    if (rawParams.duration !== undefined && rawParams.duration !== null) {
        const dur = Number(rawParams.duration);
        if (!Number.isInteger(dur) || dur < 1 || dur > 30) {
            return {
                isValid: false,
                error: `Requested duration (${dur} day${dur > 1 ? 's' : ''}) is outside the supported range of 1 to 30 days.`
            };
        }
        clean.duration = dur;
    } else {
        clean.duration = 1; // Default duration
    }

    // 4. Validate slotNumber (optional)
    if (rawParams.slotNumber !== undefined && rawParams.slotNumber !== null) {
        if (typeof rawParams.slotNumber !== 'string' && typeof rawParams.slotNumber !== 'number') {
            return {
                isValid: false,
                error: 'Invalid slot identifier format.'
            };
        }
        const rawSlotStr = String(rawParams.slotNumber).trim();
        if (/[${}[\]]/.test(rawSlotStr)) {
            return {
                isValid: false,
                error: `Invalid characters in slot identifier '${rawSlotStr}'.`
            };
        }
        const slotClean = rawSlotStr.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
        if (slotClean.length >= 1 && slotClean.length <= 10) {
            clean.slotNumber = slotClean;
        } else {
            return {
                isValid: false,
                error: `Invalid slot identifier '${rawSlotStr}'.`
            };
        }
    }

    return {
        isValid: true,
        cleanParams: clean
    };
};

/**
 * Checks real parking slot availability from MongoDB.
 *
 * STRICT READ-ONLY:
 * Does NOT call create(), save(), updateOne(), findOneAndUpdate(), or write to any collection.
 *
 * @param {Object} rawParams
 * @returns {Promise<Object>} Structured availability result
 */
const checkAvailableSlots = async (rawParams = {}) => {
    // 1. Validate all inputs on the backend
    const validation = validateAvailabilityInput(rawParams);
    if (!validation.isValid) {
        return {
            success: false,
            validationError: true,
            error: validation.error,
            message: validation.error
        };
    }

    const { vehicleType, date, duration, slotNumber } = validation.cleanParams;

    // 2. Check Database connection readiness safely
    if (mongoose.connection.readyState !== 1) {
        return {
            success: false,
            databaseError: true,
            error: 'Database unavailable',
            message: "Sorry, I couldn't check parking availability right now. Please try again."
        };
    }

    try {
        // 3. Build READ-ONLY query for ParkingSlot
        const slotQuery = {};

        if (slotNumber) {
            // Match exact slot or slot prefix (e.g. 'A1' matches 'A1-01', 'A1-02', etc.)
            slotQuery.slotNumber = new RegExp(`^${slotNumber}`, 'i');
        }

        if (vehicleType) {
            slotQuery.type = vehicleType;
        }

        // Query slots with status 'Available'
        slotQuery.status = 'Available';

        const candidateSlots = await ParkingSlot.find(slotQuery)
            .select('slotNumber type floor zone basePrice pricePerDay status')
            .lean()
            .exec();

        // If specific slot requested and not found in available slots
        if (slotNumber && (!candidateSlots || candidateSlots.length === 0)) {
            // Check if slot exists at all to give accurate reason
            const existingSlot = await ParkingSlot.findOne({
                slotNumber: new RegExp(`^${slotNumber}`, 'i')
            }).select('slotNumber type status').lean().exec();

            if (!existingSlot) {
                return {
                    success: true,
                    available: false,
                    requestedSlot: slotNumber,
                    reason: `Slot ${slotNumber} does not exist in ParkSmart.`
                };
            }

            if (vehicleType && existingSlot.type !== vehicleType) {
                return {
                    success: true,
                    available: false,
                    requestedSlot: slotNumber,
                    reason: `Slot ${existingSlot.slotNumber} is designated for ${existingSlot.type}s, not ${vehicleType}s.`
                };
            }

            return {
                success: true,
                available: false,
                requestedSlot: slotNumber,
                reason: `Slot ${existingSlot.slotNumber} is currently ${existingSlot.status.toLowerCase()}.`
            };
        }

        // 4. Cross-reference with existing active/pending bookings to prevent double-booking
        const slotIds = candidateSlots.map(s => s._id);
        const conflictingBookings = await Booking.find({
            slot: { $in: slotIds },
            status: { $in: ['Pending', 'Active'] }
        }).select('slot').lean().exec();

        const conflictingSlotIdSet = new Set(conflictingBookings.map(b => b.slot.toString()));

        // Filter out any slots that have conflicting pending or active bookings
        const availableSlots = candidateSlots
            .filter(s => !conflictingSlotIdSet.has(s._id.toString()))
            .map(s => ({
                slotNumber: s.slotNumber,
                vehicleType: s.type,
                floor: s.floor,
                zone: s.zone,
                basePrice: s.basePrice,
                pricePerDay: s.pricePerDay
            }));

        // Handle specific slot lookup
        if (slotNumber) {
            if (availableSlots.length > 0) {
                const targetSlot = availableSlots[0];
                return {
                    success: true,
                    available: true,
                    requestedSlot: slotNumber,
                    date,
                    duration,
                    slot: targetSlot,
                    slots: availableSlots
                };
            } else {
                return {
                    success: true,
                    available: false,
                    requestedSlot: slotNumber,
                    reason: `Slot ${slotNumber} has an active booking during the requested period.`
                };
            }
        }

        // Handle general availability lookup
        if (availableSlots.length === 0) {
            return {
                success: true,
                available: false,
                count: 0,
                slots: [],
                message: `No available ${vehicleType || ''} slots found for ${date}.`
            };
        }

        return {
            success: true,
            available: true,
            count: availableSlots.length,
            date,
            duration,
            vehicleType: vehicleType || 'All',
            // Return top 8 available slots for clean presentation
            slots: availableSlots.slice(0, 8)
        };

    } catch (err) {
        console.error('checkAvailableSlots database error:', err.message);
        return {
            success: false,
            databaseError: true,
            error: 'Database query failure',
            message: "Sorry, I couldn't check parking availability right now. Please try again."
        };
    }
};

let genAIClient = null;
const getClient = () => {
    if (!genAIClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        const { GoogleGenAI } = require('@google/genai');
        genAIClient = new GoogleGenAI({ apiKey });
    }
    return genAIClient;
};

/**
 * Handles conversational availability check with Gemini function calling.
 *
 * @param {string} message - Current user message
 * @param {Array} history - Prior conversation history
 * @param {Object} bookingContext - Any existing booking context
 * @param {Object} forcedParams - Pre-validated parameters if any
 * @returns {Promise<{ reply: string, toolCalled: boolean, toolResult: Object|null, toolArgs: Object|null }>}
 */
const executeAvailabilityWithGemini = async (message, history = [], bookingContext = null, forcedParams = null) => {
    const ai = getClient();
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const today = getTodayDateIST();

    const systemInstruction = `You are ParkSmart AI, the assistant for ParkSmart Parking Management System.
Current server date is ${today} (Asia/Kolkata timezone).

You have access to the tool 'checkAvailableSlots' to check real-time parking slot availability in the database.

OPERATIONAL INSTRUCTIONS:
1. When checking availability, at least a date is required (can be relative like 'today', 'tomorrow', or 'YYYY-MM-DD').
2. If the user has NOT specified a date and no date was provided earlier, DO NOT call checkAvailableSlots. Instead, politely ask for the required date and vehicle type (Car or Bike).
3. If the user specified a vehicle type (Car or Bike), pass vehicleType.
4. If the user provided a duration (in days), pass duration. If omitted, default to 1.
5. If the user provided a specific slot (e.g., 'A1', 'A1-01', 'B2'), pass slotNumber.
6. When checkAvailableSlots returns available slots, describe the available options (slot numbers, floor, zone, rates).
7. If checkAvailableSlots indicates the slot or vehicle type is unavailable, communicate that clearly and politely without claiming it is booked.
8. If checkAvailableSlots returns a database error or says unable to check, reply with: "Sorry, I couldn't check parking availability right now. Please try again."

CRITICAL SAFETY BOUNDARIES (PHASE 5A):
- You must NEVER create, modify, confirm, or cancel bookings.
- You must NEVER claim that a booking was made, confirmed, or saved.
- If the user asks to book (e.g., "Book A1 tomorrow"), check if the slot is available using checkAvailableSlots, and then state clearly that the slot is available, but booking creation through ParkSmart AI is not enabled yet in this phase. Tell them they can book it directly on the Booking page (/booking).`;

    // Incorporate prior history and context
    const chat = ai.chats.create({
        model,
        config: {
            systemInstruction,
            tools: [CHECK_AVAILABLE_SLOTS_TOOL],
            temperature: 0.2
        }
    });

    // Provide context if existing bookingContext had details
    let enhancedMessage = message;
    if (bookingContext && bookingContext.details) {
        const details = bookingContext.details;
        const ctxParts = [];
        if (details.vehicleType) ctxParts.push(`vehicleType: ${details.vehicleType}`);
        if (details.date) ctxParts.push(`date: ${details.date}`);
        if (details.duration) ctxParts.push(`duration: ${details.duration}`);
        if (details.slotNumber) ctxParts.push(`slotNumber: ${details.slotNumber}`);
        if (ctxParts.length > 0) {
            enhancedMessage = `[Known Context: ${ctxParts.join(', ')}]\n${message}`;
        }
    }

    try {
        const firstTurn = await chat.sendMessage({ message: enhancedMessage });

        if (firstTurn.functionCalls && firstTurn.functionCalls.length > 0) {
            const call = firstTurn.functionCalls[0];
            if (call.name === 'checkAvailableSlots') {
                const callArgs = { ...call.args };
                // If forcedParams provided (e.g. from validated booking intent), merge them
                if (forcedParams) {
                    if (forcedParams.date && !callArgs.date) callArgs.date = forcedParams.date;
                    if (forcedParams.vehicleType && !callArgs.vehicleType) callArgs.vehicleType = forcedParams.vehicleType;
                    if (forcedParams.duration && !callArgs.duration) callArgs.duration = forcedParams.duration;
                    if (forcedParams.slotNumber && !callArgs.slotNumber) callArgs.slotNumber = forcedParams.slotNumber;
                }

                // Server executes the tool with backend validation
                const toolResult = await checkAvailableSlots(callArgs);

                // Pass tool response back to Gemini
                const secondTurn = await chat.sendMessage({
                    message: [{
                        functionResponse: {
                            name: 'checkAvailableSlots',
                            response: toolResult
                        }
                    }]
                });

                return {
                    reply: secondTurn.text || "Here is the parking availability information.",
                    toolCalled: true,
                    toolArgs: callArgs,
                    toolResult
                };
            }
        }

        // Direct conversational response from Gemini (e.g. asking for missing date)
        return {
            reply: firstTurn.text || "Could you please specify the date and vehicle type you would like to check availability for?",
            toolCalled: false,
            toolArgs: null,
            toolResult: null
        };
    } catch (err) {
        console.error('executeAvailabilityWithGemini error:', err.message);
        return {
            reply: "Sorry, I couldn't check parking availability right now. Please try again.",
            toolCalled: false,
            toolArgs: null,
            toolResult: null,
            error: err.message
        };
    }
};

/**
 * Calculates booking price based on authoritative backend PRICING rules.
 *
 * @param {'Car'|'Bike'} vehicleType
 * @param {number} duration - In days (1-30)
 * @returns {number} Estimated total amount in INR
 */
const calculateBookingPrice = (vehicleType, duration = 1) => {
    const pricing = PRICING[vehicleType] || PRICING.Car;
    const dur = Math.max(1, parseInt(duration, 10) || 1);
    const base = pricing.basePrice;
    const additional = dur > 1 ? (dur - 1) * pricing.pricePerDay : 0;
    return base + additional;
};

/**
 * In-memory short-lived confirmation store with 5-minute TTL and bounded memory safety.
 * Maps userId string -> pending booking object.
 */
const MAX_PENDING_STORE_ENTRIES = 1000;
const CONFIRMATION_TTL_MS = 5 * 60 * 1000; // 5 minutes

const pendingBookingStore = new Map();
const pendingCancellationStore = new Map();

/**
 * Prunes expired entries from an in-memory store to prevent unbounded memory growth.
 */
const pruneExpiredStore = (store) => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now > entry.expiresAt) {
            store.delete(key);
        }
    }
};

// Periodic unref'd cleanup every 2 minutes
const storeCleanupTimer = setInterval(() => {
    pruneExpiredStore(pendingBookingStore);
    pruneExpiredStore(pendingCancellationStore);
}, 2 * 60 * 1000);

if (storeCleanupTimer.unref) {
    storeCleanupTimer.unref();
}

const setPendingBooking = (userId, data) => {
    if (!userId) return;
    // Enforce memory bounds
    if (pendingBookingStore.size >= MAX_PENDING_STORE_ENTRIES) {
        pruneExpiredStore(pendingBookingStore);
        if (pendingBookingStore.size >= MAX_PENDING_STORE_ENTRIES) {
            // Drop oldest key
            const oldestKey = pendingBookingStore.keys().next().value;
            if (oldestKey) pendingBookingStore.delete(oldestKey);
        }
    }
    pendingBookingStore.set(userId.toString(), {
        ...data,
        expiresAt: Date.now() + CONFIRMATION_TTL_MS
    });
};

const getPendingBooking = (userId) => {
    if (!userId) return null;
    const entry = pendingBookingStore.get(userId.toString());
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        pendingBookingStore.delete(userId.toString());
        return null;
    }
    return entry;
};

const clearPendingBooking = (userId) => {
    if (userId) {
        pendingBookingStore.delete(userId.toString());
    }
};

const setPendingCancellation = (userId, data) => {
    if (!userId) return;
    if (pendingCancellationStore.size >= MAX_PENDING_STORE_ENTRIES) {
        pruneExpiredStore(pendingCancellationStore);
        if (pendingCancellationStore.size >= MAX_PENDING_STORE_ENTRIES) {
            const oldestKey = pendingCancellationStore.keys().next().value;
            if (oldestKey) pendingCancellationStore.delete(oldestKey);
        }
    }
    pendingCancellationStore.set(userId.toString(), {
        ...data,
        expiresAt: Date.now() + CONFIRMATION_TTL_MS
    });
};

const getPendingCancellation = (userId) => {
    if (!userId) return null;
    const entry = pendingCancellationStore.get(userId.toString());
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        pendingCancellationStore.delete(userId.toString());
        return null;
    }
    return entry;
};

const clearPendingCancellation = (userId) => {
    if (userId) {
        pendingCancellationStore.delete(userId.toString());
    }
};

/**
 * Detects whether user message is an explicit positive confirmation,
 * cancellation/rejection, change/modification, any slot request, or none.
 *
 * @param {string} message
 * @returns {'confirm' | 'cancel' | 'modify' | 'any_slot' | 'none'}
 */
const detectConfirmationIntent = (message) => {
    const text = (message || '').trim().toLowerCase();

    // 1. Any slot selection ("Any slot is fine", "any slot", etc.)
    if (/\b(any slot|any slot is fine|choose any slot|any available slot|whichever slot|any is fine)\b/i.test(text)) {
        return 'any_slot';
    }

    // 2. Modification requests (e.g. "actually give me B2", "make it 3 days", "no, choose B1-01", "actually make it Saturday")
    if (/\b(actually|instead|change to|give me|make it|switch to|choose)\b/i.test(text) ||
        /^(no,\s*(?:choose|give me|make it|change to|switch to|select))\b/i.test(text)) {
        return 'modify';
    }

    // 3. Rejection / Cancellation
    if (/^(no|nope|cancel|don't|dont|do not|not now|never mind|stop|abort|leave it|reject)\b/i.test(text) ||
        /\b(don't book|dont book|do not book|cancel it|cancel this booking|cancel my booking|don't cancel|dont cancel)\b/i.test(text)) {
        return 'cancel';
    }

    // 4. Ambiguous questions / expressions - NOT confirmation!
    if (/\b(maybe|okay\?|ok\?|is it|what is|tell me|which|how much|can i|why)\b/i.test(text) && !/^(yes|confirm|book it)/i.test(text)) {
        return 'none';
    }

    // 5. Explicit Confirmation
    if (/^(yes|yeah|yep|confirm|confirm it|confirm the booking|go ahead|book it|please book|please confirm|proceed|book now|sure, book it|yes please|sure)\b/i.test(text) ||
        /\b(confirm the booking|please confirm my booking|go ahead and book|yes confirm|yes please book)\b/i.test(text)) {
        return 'confirm';
    }

    return 'none';
};

/**
 * Controlled cancellation tool for authenticated users.
 * Reuses existing ParkSmart cancellation business logic.
 *
 * @param {string} bookingId
 * @param {Object} user - Authenticated req.user
 * @returns {Promise<Object>} { success, booking, message, authRequired, unauthorized, invalidStatus }
 */
const cancelBookingTool = async (bookingId, user) => {
    if (!user || !user._id) {
        return {
            success: false,
            authRequired: true,
            message: 'Please log in to your ParkSmart account to cancel a booking.'
        };
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return {
            success: false,
            message: 'Invalid booking identifier.'
        };
    }

    const booking = await Booking.findById(bookingId).populate('slot');
    if (!booking) {
        return {
            success: false,
            message: 'Booking not found.'
        };
    }

    // Verify ownership: authenticated req.user._id must match booking.user
    if (booking.user.toString() !== user._id.toString() && !user.isAdmin) {
        return {
            success: false,
            unauthorized: true,
            message: 'Not authorized to cancel this booking.'
        };
    }

    // ParkSmart business logic: Only 'Pending' bookings can be cancelled
    if (booking.status !== 'Pending') {
        return {
            success: false,
            invalidStatus: true,
            message: `Cannot cancel a booking with status: ${booking.status}. Only Pending bookings can be cancelled.`
        };
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Free up associated slot if reserved and NO other pending/active booking depends on it
    if (booking.slot) {
        const slotId = booking.slot._id || booking.slot;
        const otherConflict = await Booking.findOne({
            _id: { $ne: booking._id },
            slot: slotId,
            status: { $in: ['Pending', 'Active'] }
        });
        if (!otherConflict) {
            const slot = await ParkingSlot.findById(slotId);
            if (slot && slot.status !== 'Available') {
                slot.status = 'Available';
                slot.reservedFor = null;
                slot.currentVehicle = {};
                await slot.save();
            }
        }
    }

    return {
        success: true,
        booking: {
            bookingId: booking._id.toString(),
            ticketNumber: booking.ticketNumber,
            slotNumber: booking.slot ? booking.slot.slotNumber : 'N/A',
            status: booking.status
        }
    };
};

/**
 * Controlled booking history tool for authenticated users.
 * Queries only the authenticated user's bookings and returns safe sanitized fields.
 *
 * @param {Object} user - Authenticated req.user
 * @returns {Promise<Object>} { success, count, bookings, message, authRequired }
 */
const getMyBookingsTool = async (user) => {
    if (!user || !user._id) {
        return {
            success: false,
            authRequired: true,
            message: 'Please log in to view your bookings.'
        };
    }

    const bookings = await Booking.find({ user: user._id })
        .populate('slot')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    const safeBookings = bookings.map(b => ({
        ticketNumber: b.ticketNumber,
        slotNumber: b.slot ? b.slot.slotNumber : 'N/A',
        vehicleType: b.vehicleType,
        vehicleNumber: b.vehicleNumber,
        date: b.startTime ? new Date(b.startTime).toISOString().split('T')[0] : (b.requestTime ? new Date(b.requestTime).toISOString().split('T')[0] : getTodayDateIST()),
        duration: b.requestedDuration || 1,
        status: b.status,
        amount: b.totalAmount || b.baseAmount || 0
    }));

    return {
        success: true,
        count: safeBookings.length,
        bookings: safeBookings
    };
};

/**
 * Executes controlled booking creation with mandatory final availability re-check.
 *
 * Backend authority:
 * - Never trusts Gemini-provided userId, ownerName, phone, price, or status.
 * - Authenticated req.user is authoritative.
 * - Re-checks slot availability and conflicting bookings immediately before creating document.
 * - Clears pending confirmation state immediately upon completion.
 *
 * @param {Object} parameters - Parameters from pending intent or tool call
 * @param {Object} user - Authenticated req.user object
 * @returns {Promise<Object>} Execution result { success, booking, message, slotUnavailable, authRequired }
 */
const executeCreateBooking = async (parameters = {}, user = null) => {
    // 1. Mandatory authentication check
    if (!user || !user._id) {
        return {
            success: false,
            authRequired: true,
            message: "Please log in to your ParkSmart account before I can create a booking."
        };
    }

    // 2. Server-side confirmation state check & concurrency protection
    const pending = getPendingBooking(user._id);
    if (!pending) {
        return {
            success: false,
            noPendingBooking: true,
            message: "No pending booking was found to confirm. Please tell me your vehicle type, date, and duration to start a booking request."
        };
    }

    if (pending.processing) {
        return {
            success: false,
            message: "A booking confirmation is already being processed. Please wait a moment."
        };
    }
    pending.processing = true;

    // 3. Resolve slot
    const slotNumberToBook = parameters.slotNumber || pending.slotNumber;
    let slot = null;
    if (pending.slotId && mongoose.Types.ObjectId.isValid(pending.slotId)) {
        slot = await ParkingSlot.findById(pending.slotId);
    }
    if (!slot && slotNumberToBook) {
        slot = await ParkingSlot.findOne({ slotNumber: new RegExp(`^${slotNumberToBook}`, 'i') });
    }

    if (!slot) {
        clearPendingBooking(user._id);
        return {
            success: false,
            message: `The requested slot ${slotNumberToBook} does not exist.`
        };
    }

    // 4. Mandatory final availability re-check
    if (slot.status !== 'Available') {
        clearPendingBooking(user._id);
        return {
            success: false,
            slotUnavailable: true,
            message: `Slot ${slot.slotNumber} is no longer available. Would you like me to check other available slots?`
        };
    }

    // Re-check conflicting Pending or Active bookings
    const activeConflict = await Booking.findOne({
        slot: slot._id,
        status: { $in: ['Pending', 'Active'] }
    });
    if (activeConflict) {
        clearPendingBooking(user._id);
        return {
            success: false,
            slotUnavailable: true,
            message: `Slot ${slot.slotNumber} was just reserved by another user. Would you like me to check other available slots?`
        };
    }

    // 5. Invoke shared booking creation business logic
    try {
        const vehicleNumber = parameters.vehicleNumber || pending.vehicleNumber;
        const vehicleType = parameters.vehicleType || pending.vehicleType;
        const requestedDuration = parameters.duration || pending.duration;
        const vehicleModel = parameters.vehicleModel || pending.vehicleModel || '';

        const createdBooking = await createBookingRecord({
            userId: user._id,
            slotId: slot._id,
            vehicleNumber,
            vehicleType,
            vehicleModel,
            ownerName: user.name || pending.ownerName,
            phoneNumber: user.phone || pending.phoneNumber,
            requestedDuration
        });

        // 6. Clear pending booking state immediately on success
        clearPendingBooking(user._id);

        return {
            success: true,
            booking: {
                bookingId: createdBooking._id.toString(),
                ticketNumber: createdBooking.ticketNumber,
                slotNumber: slot.slotNumber,
                vehicleType: createdBooking.vehicleType,
                vehicleNumber: createdBooking.vehicleNumber,
                duration: createdBooking.requestedDuration,
                date: pending.date || getTodayDateIST(),
                status: createdBooking.status,
                baseAmount: createdBooking.baseAmount,
                additionalAmount: createdBooking.additionalAmount,
                totalAmount: createdBooking.totalAmount
            }
        };
    } catch (err) {
        clearPendingBooking(user._id);
        return {
            success: false,
            message: err.message || "Failed to create booking."
        };
    }
};

module.exports = {
    CHECK_AVAILABLE_SLOTS_TOOL,
    CREATE_BOOKING_TOOL,
    validateAvailabilityInput,
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
    resolveNaturalDate,
    getTodayDateIST
};
