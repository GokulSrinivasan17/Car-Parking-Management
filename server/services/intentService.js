const { GoogleGenAI } = require('@google/genai');
const { resolveNaturalDate, getTodayDateIST } = require('./parkingTools');

/**
 * Structured Output Schema for Gemini Intent & Entity Extraction
 */
const INTENT_SCHEMA = {
    type: 'OBJECT',
    properties: {
        intent: {
            type: 'STRING',
            enum: ['booking', 'faq', 'availability', 'cancellation', 'booking_history', 'general']
        },
        confidence: { type: 'NUMBER' },
        vehicleType: { type: 'STRING' },
        vehicleNumber: { type: 'STRING' },
        vehicleModel: { type: 'STRING' },
        date: { type: 'STRING' },
        duration: { type: 'INTEGER' },
        startTime: { type: 'STRING' },
        slotNumber: { type: 'STRING' },
        ownerName: { type: 'STRING' },
        phoneNumber: { type: 'STRING' }
    },
    required: ['intent']
};

let genAIClient = null;

const getClient = () => {
    if (!genAIClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        genAIClient = new GoogleGenAI({ apiKey });
    }
    return genAIClient;
};

/**
 * Calls Gemini with structured output schema to classify user intent and extract raw entities.
 *
 * @param {string} message - Current user message
 * @param {Array} history - Prior conversation history
 * @returns {Promise<Object>} Extracted raw intent and entity object
 */
const extractIntentAndEntities = async (message, history = []) => {
    const client = getClient();
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const today = getTodayDateIST();

    const systemPrompt = `You are the Natural Language Intent and Entity Extraction engine for the ParkSmart Parking Management System.
Current server date is ${today} (Asia/Kolkata timezone).

Your task is to analyze the user's message and prior conversation history to determine:
1. Intent:
   - 'booking': User wants to book, reserve, or request parking.
   - 'faq': User is asking questions about how ParkSmart works, prices, rules, locations, etc.
   - 'availability': User is asking if a slot or parking is currently available.
   - 'cancellation': User wants to cancel an existing booking.
   - 'booking_history': User wants to see, check, or list their bookings.
   - 'general': Greetings, small talk, acknowledgments, or unrelated talk.
2. Extract booking details if mentioned in the message or prior history:
   - vehicleType: Normalize to 'Car' or 'Bike' if recognized, or the exact word if unsupported (e.g., 'truck').
   - vehicleNumber: Registration/license plate or vehicle number (e.g. 'TN38AB1234', 'MH02AB1234', 'KA01MJ5000'). Extract the alphanumeric plate whenever provided.
   - vehicleModel: e.g. 'Honda City', 'Activa'.
   - date: Resolve relative dates (today, tomorrow, day after tomorrow, next Monday, etc.) to YYYY-MM-DD using today=${today}.
   - duration: Number of days ONLY if explicitly requested (e.g. '2 days' -> 2, 'for a week' -> 7, '1 day' -> 1). Do NOT infer duration from relative dates like 'today' or 'tomorrow'.
   - startTime: Normalized time e.g. '10:00', '14:00'.
   - slotNumber: e.g. 'A1', 'B2'.
   - ownerName: Full name of vehicle owner.
   - phoneNumber: Phone number.`;

    // Build context incorporating prior conversation turns
    const contextLines = [];
    if (Array.isArray(history) && history.length > 0) {
        contextLines.push('Prior Conversation History:');
        for (const item of history.slice(-6)) {
            if (!item || !item.content) continue;
            contextLines.push(`${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`);
        }
    }
    contextLines.push(`Current User Message: "${message}"`);

    const promptText = `${systemPrompt}\n\n${contextLines.join('\n')}`;

    try {
        const response = await client.models.generateContent({
            model,
            contents: promptText,
            config: {
                responseMimeType: 'application/json',
                responseSchema: INTENT_SCHEMA,
                temperature: 0.1
            }
        });

        if (response && response.text) {
            return JSON.parse(response.text.trim());
        }
    } catch (err) {
        console.error('Intent extraction failed:', err.message);
    }

    return { intent: 'general', confidence: 0.5 };
};

const WORD_TO_NUM = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

/**
 * Deterministic regex entity extractor to supplement LLM output.
 * Ensures explicit plates, days, and keywords are never dropped.
 */
const extractFromText = (message) => {
    const text = message || '';
    const extracted = {};

    // 1. Vehicle Type
    if (/\b(car|sedan|suv|four[- ]?wheeler|automobile)\b/i.test(text)) {
        extracted.vehicleType = 'Car';
    } else if (/\b(bike|motorcycle|scooter|two[- ]?wheeler)\b/i.test(text)) {
        extracted.vehicleType = 'Bike';
    } else {
        const unsupportedMatch = text.match(/\b(truck|bus|van|helicopter|lorry|auto|rickshaw)\b/i);
        if (unsupportedMatch) extracted.vehicleType = unsupportedMatch[1];
    }

    // 2. Vehicle Registration Plate (handles TN38AB1234, TN 38 AB 1234, KA01MJ5000, etc.)
    const spacedPlateMatch = text.match(/\b([A-Za-z]{2}\s*[0-9]{1,2}\s*[A-Za-z]{0,3}\s*[0-9]{4})\b/i);
    const labeledPlateMatch = text.match(/(?:vehicle\s+(?:number|no|plate|reg)[:\s]*|vehicle[:\s]+|plate[:\s]*)([A-Za-z0-9\s-]{2,18})/i);
    if (spacedPlateMatch) {
        const candidate = spacedPlateMatch[1].replace(/\s+/g, '').toUpperCase();
        if (!['NUMBER', 'VEHICLE', 'CAR', 'BIKE', 'PLATE', 'REGISTRATION'].includes(candidate)) {
            extracted.vehicleNumber = candidate;
        }
    } else if (labeledPlateMatch) {
        const candidate = labeledPlateMatch[1].replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
        if (!['NUMBER', 'VEHICLE', 'CAR', 'BIKE', 'PLATE', 'REGISTRATION'].includes(candidate)) {
            extracted.vehicleNumber = candidate;
        }
    }

    // 3. Duration in days (handles "2 days", "for a week", "one day", etc.)
    if (/\b(?:for\s+)?(?:a|one|1)\s*week\b/i.test(text)) {
        extracted.duration = 7;
    } else if (/\b(?:for\s+)?(?:two|2)\s*weeks\b/i.test(text)) {
        extracted.duration = 14;
    } else {
        const durationMatch = text.match(/(?:for\s+)?(\d+)\s*days?\b/i);
        if (durationMatch) {
            extracted.duration = parseInt(durationMatch[1], 10);
        } else {
            const wordMatch = text.match(/(?:for\s+)?(one|two|three|four|five|six|seven|eight|nine|ten)\s*days?\b/i);
            if (wordMatch) extracted.duration = WORD_TO_NUM[wordMatch[1].toLowerCase()];
        }
    }

    // 4. Specific Slot (e.g. "A1", "A1-05", "B1-01")
    const slotMatch = text.match(/(?:slot|reserve|bay|to|choose)\s*([A-Za-z]\d+(?:-\d+)?)\b/i) || text.match(/\b([A-Za-z]\d+(?:-\d+)?)\b/);
    if (slotMatch) {
        const candidateSlot = slotMatch[1].toUpperCase();
        if (!['TN', 'DL', 'MH', 'KA', 'KL', 'HR', 'UP', 'WB', 'TS', 'AP'].includes(candidateSlot)) {
            extracted.slotNumber = candidateSlot;
        }
    }

    // 5. Natural Date (today, tomorrow, day after tomorrow, this Friday, next Monday, etc.)
    const resolvedDate = resolveNaturalDate(text);
    if (resolvedDate) {
        extracted.date = resolvedDate;
    }

    // 6. Explicit Intent hints
    if (/\b(show my bookings|my bookings|what bookings|parking history|booking history|where is my booking|do i have an active booking)\b/i.test(text)) {
        extracted.intent = 'booking_history';
    } else if (/\b(cancel my booking|cancel booking|cancel reservation|cancel slot)\b/i.test(text)) {
        extracted.intent = 'cancellation';
    } else if (/\b(available|availability|is slot|are there any slots|slots available)\b/i.test(text)) {
        extracted.intent = 'availability';
    } else if (/\b(need parking|want to book|book a|reserve a|book my|park my|parking slot for)\b/i.test(text)) {
        extracted.intent = 'booking';
    }

    return extracted;
};

/**
 * Validates, normalizes, and merges extracted booking details on the backend.
 * The backend is the sole authority for validation.
 *
 * @param {Object} rawExtracted - Raw output from Gemini
 * @param {Object} priorState - Previous booking state from session/request if any
 * @param {Object} user - Authenticated user object if logged in
 * @param {string} message - Original user message for fallback entity verification
 * @returns {Object} Validated and structured booking intent
 */
const validateAndMergeBookingIntent = (rawExtracted = {}, priorState = {}, user = null, message = '') => {
    const validationIssues = [];
    const today = getTodayDateIST();
    const fallbackExtracted = extractFromText(message);

    // Start with prior state details if available
    const priorDetails = priorState.details || {};
    const details = {
        vehicleType: null,
        vehicleNumber: null,
        vehicleModel: null,
        ownerName: null,
        phoneNumber: null,
        date: null,
        startTime: null,
        duration: null,
        slotNumber: null
    };

    // 1. Vehicle Type
    const rawType = (rawExtracted.vehicleType || fallbackExtracted.vehicleType || priorDetails.vehicleType || '').trim();
    if (rawType) {
        const lower = rawType.toLowerCase();
        if (lower.includes('car') || lower.includes('four') || lower.includes('sedan') || lower.includes('suv')) {
            details.vehicleType = 'Car';
        } else if (lower.includes('bike') || lower.includes('two') || lower.includes('motorcycle') || lower.includes('scooter')) {
            details.vehicleType = 'Bike';
        } else {
            validationIssues.push(`Vehicle type '${rawType}' is not supported. ParkSmart supports only 'Car' and 'Bike'.`);
            details.vehicleType = null;
        }
    }

    // 2. Vehicle Number
    const malformedPlateMatch = message.match(/(?:vehicle\s*(?:number|no|plate|reg)?\s*[:\s]*|plate\s*[:\s]*)([^a-zA-Z0-9\s,.;]{2,})/i);
    const rawPlate = (rawExtracted.vehicleNumber || fallbackExtracted.vehicleNumber || priorDetails.vehicleNumber || '').trim();

    if (malformedPlateMatch) {
        validationIssues.push(`Invalid vehicle number format '${malformedPlateMatch[1]}'. Registration must be 2-15 alphanumeric characters (e.g. TN38AB1234).`);
        details.vehicleNumber = null;
    } else if (rawPlate) {
        const sanitized = rawPlate.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
        if (/^[A-Z0-9-]{2,15}$/.test(sanitized) && !['NUMBER', 'VEHICLE', 'CAR', 'BIKE', 'PLATE', 'REGISTRATION'].includes(sanitized)) {
            details.vehicleNumber = sanitized;
        } else {
            validationIssues.push(`Invalid vehicle number format '${rawPlate}'. Registration must be 2-15 alphanumeric characters (e.g. TN38AB1234).`);
            details.vehicleNumber = null;
        }
    }

    // 3. Vehicle Model (Optional)
    const rawModel = (rawExtracted.vehicleModel || priorDetails.vehicleModel || '').trim();
    if (rawModel) {
        details.vehicleModel = rawModel;
    }

    // 4. Duration (Only accept if explicitly provided in message, prior state, or answering duration question)
    let rawDuration = null;
    const hasExplicitDur = /\b(\d+\s*days?|(?:for\s+)?(?:a|one|1)\s*week|(?:for\s+)?(?:two|2)\s*weeks|(?:one|two|three|four|five|six|seven|eight|nine|ten)\s*days?)\b/i.test(message);

    if (fallbackExtracted.duration !== undefined && fallbackExtracted.duration !== null) {
        rawDuration = Number(fallbackExtracted.duration);
    } else if (priorState.awaitingField === 'duration') {
        const numMatch = message.match(/\b(\d+)\b/);
        if (numMatch) {
            rawDuration = parseInt(numMatch[1], 10);
        } else if (rawExtracted.duration !== undefined && rawExtracted.duration !== null) {
            rawDuration = Number(rawExtracted.duration);
        }
    } else if (rawExtracted.duration !== undefined && rawExtracted.duration !== null && hasExplicitDur) {
        rawDuration = Number(rawExtracted.duration);
    } else if (priorDetails.duration !== undefined && priorDetails.duration !== null) {
        rawDuration = Number(priorDetails.duration);
    }

    if (rawDuration !== null && !isNaN(rawDuration)) {
        if (!Number.isInteger(rawDuration) || rawDuration < 1 || rawDuration > 30) {
            validationIssues.push(`Requested duration (${rawDuration} day${rawDuration > 1 ? 's' : ''}) is outside the supported range of 1 to 30 days.`);
            details.duration = null;
        } else {
            details.duration = rawDuration;
        }
    }

    // 5. Date
    const rawDate = (rawExtracted.date || fallbackExtracted.date || priorDetails.date || '').trim();
    if (rawDate) {
        // Check if YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            if (rawDate < today) {
                validationIssues.push(`Requested date (${rawDate}) is in the past. Bookings must be for today (${today}) or future dates.`);
                details.date = null;
            } else {
                details.date = rawDate;
            }
        } else if (rawDate.toLowerCase().includes('tomorrow')) {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            details.date = d.toISOString().split('T')[0];
        } else if (rawDate.toLowerCase().includes('today')) {
            details.date = today;
        } else {
            validationIssues.push(`Date format '${rawDate}' is ambiguous. Please provide a clear date such as 'tomorrow' or 'YYYY-MM-DD'.`);
            details.date = null;
        }
    }

    // 6. Time (Optional)
    const rawTime = (rawExtracted.startTime || priorDetails.startTime || '').trim();
    if (rawTime) {
        details.startTime = rawTime;
    }

    // 7. Slot Number (Optional)
    const rawSlot = (rawExtracted.slotNumber || fallbackExtracted.slotNumber || priorDetails.slotNumber || '').trim().toUpperCase();
    if (rawSlot) {
        details.slotNumber = rawSlot;
    }

    // 8. Owner Name & Phone Number
    // Auto-fill from authenticated user profile if available
    if (user) {
        details.ownerName = details.ownerName || user.name || null;
        details.phoneNumber = details.phoneNumber || user.phone || null;
    }
    if (!details.ownerName && (rawExtracted.ownerName || priorDetails.ownerName)) {
        details.ownerName = (rawExtracted.ownerName || priorDetails.ownerName).trim();
    }
    if (!details.phoneNumber && (rawExtracted.phoneNumber || priorDetails.phoneNumber)) {
        details.phoneNumber = (rawExtracted.phoneNumber || priorDetails.phoneNumber).trim();
    }

    // Identify missing details for booking in strict priority order:
    // vehicleType -> vehicleNumber -> date -> duration
    const missingDetails = [];
    if (!details.vehicleType) missingDetails.push('vehicleType');
    if (!details.vehicleNumber) missingDetails.push('vehicleNumber');
    if (!details.date) missingDetails.push('date');
    if (!details.duration) missingDetails.push('duration');

    // Only require owner info if not logged in and not provided
    if (!user) {
        if (!details.ownerName) missingDetails.push('ownerName');
        if (!details.phoneNumber) missingDetails.push('phoneNumber');
    }

    // Determine the single next field we are awaiting (one question at a time)
    const awaitingField = missingDetails.length > 0 ? missingDetails[0] : null;

    const readyForAvailabilityCheck =
        details.vehicleType !== null &&
        details.date !== null &&
        details.duration !== null &&
        details.vehicleNumber !== null &&
        validationIssues.length === 0;

    return {
        intent: rawExtracted.intent || 'booking',
        confidence: rawExtracted.confidence || 0.9,
        details,
        missingDetails,
        awaitingField,
        validationIssues,
        readyForAvailabilityCheck
    };
};

/**
 * Builds conversational assistant response based on the validated booking intent.
 * Strict rule: Asks ONE question at a time to keep the conversation natural and uncluttered.
 *
 * @param {Object} intentResult - Result from validateAndMergeBookingIntent
 * @returns {string} Natural language response text
 */
const buildBookingConversationalResponse = (intentResult) => {
    const { details, missingDetails, validationIssues, readyForAvailabilityCheck, awaitingField } = intentResult;

    // 1. If validation issues exist, prioritize explaining the issue
    if (validationIssues && validationIssues.length > 0) {
        const issueMsg = validationIssues.join(' ');
        if (missingDetails.includes('duration')) {
            return `${issueMsg} ParkSmart accepts reservations between 1 and 30 days. How many days do you need parking?`;
        }
        if (missingDetails.includes('vehicleType')) {
            return `${issueMsg} What type of vehicle are you parking (Car or Bike)?`;
        }
        if (missingDetails.includes('vehicleNumber')) {
            return `${issueMsg} What is your vehicle number?`;
        }
        if (missingDetails.includes('date')) {
            return `${issueMsg} What date do you need the parking slot?`;
        }
        return issueMsg;
    }

    // 2. If ready for availability check
    if (readyForAvailabilityCheck) {
        return `I have all required details for your ${details.vehicleType} (${details.vehicleNumber}) starting ${details.date} for ${details.duration} day(s). Checking availability now...`;
    }

    // 3. Ask ONE question at a time based on the awaitingField in strict priority
    if (awaitingField === 'vehicleType') {
        return `Sure. What type of vehicle are you parking?`;
    }

    if (awaitingField === 'vehicleNumber') {
        return `Got it. What is your vehicle number?`;
    }

    if (awaitingField === 'date') {
        return `What date do you need the parking slot?`;
    }

    if (awaitingField === 'duration') {
        return `How many days do you need parking?`;
    }

    if (awaitingField === 'ownerName') {
        return `Could you please provide the owner's full name for the booking?`;
    }

    if (awaitingField === 'phoneNumber') {
        return `What is your contact phone number for the booking?`;
    }

    return `Sure, what type of vehicle are you parking?`;
};

module.exports = {
    getTodayDateIST,
    INTENT_SCHEMA,
    extractIntentAndEntities,
    extractFromText,
    validateAndMergeBookingIntent,
    buildBookingConversationalResponse
};
