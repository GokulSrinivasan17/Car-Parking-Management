/**
 * ParkSmart Controlled FAQ Knowledge Base & Lightweight Retrieval Service
 * Contains ONLY verified facts from the existing ParkSmart application codebase.
 */

const PARKSMART_FAQ_ITEMS = [
    {
        id: 'overview',
        keywords: ['what is parksmart', 'about parksmart', 'overview', 'what can', 'features', 'how does it work', 'platform', 'system'],
        topic: 'About ParkSmart',
        content: `ParkSmart is a next-generation smart parking management system built on the MERN stack (MongoDB, Express, React, Node.js).
It enables users to browse parking slots across multi-level floors in real-time, submit slot booking requests, track their parked vehicle with a live digital parking pass and elapsed stay duration, and view digital checkout receipts.`
    },
    {
        id: 'registration_login',
        keywords: ['register', 'sign up', 'signup', 'create account', 'login', 'log in', 'signin', 'sign in', 'account', 'password'],
        topic: 'User Registration & Authentication',
        content: `To register an account on ParkSmart:
- Navigate to the Register page (/register).
- Required fields: Full Name (minimum 2 characters), Email address (valid format), Password (minimum 6 characters), and Phone number.
To log in:
- Navigate to the Login page (/login).
- Provide your registered Email and Password.
- Upon successful login, a secure JWT authentication token is issued and your session is saved in your browser.`
    },
    {
        id: 'slots_and_types',
        keywords: ['slot', 'slots', 'bay', 'floor', 'zone', 'vehicle type', 'car', 'bike', 'types of parking', 'status'],
        topic: 'Parking Slots & Facility Layout',
        content: `Parking slots in ParkSmart have the following characteristics:
- Vehicle Types: Slots are designated specifically for either 'Car' (Four-Wheeler) or 'Bike' (Two-Wheeler). A car cannot be parked in a bike slot and vice versa.
- Levels & Zones: Slots are organized across multi-level floors (Floor 1 & Floor 2) and Zones (such as Zone A and Zone B).
- Statuses: A slot can have one of three statuses: 'Available' (open for booking), 'Occupied' (currently in use), or 'Maintenance'.
- Public Visibility: Anyone can view the real-time slot occupancy grid on the Home page or Parked Slots page (/parked-slots).`
    },
    {
        id: 'pricing_tariff',
        keywords: ['price', 'pricing', 'cost', 'tariff', 'rates', 'fare', 'fee', 'charge', 'how much', 'money', 'billing'],
        topic: 'Pricing Tariff & Rates',
        content: `ParkSmart parking rates are billed per day based on vehicle type:
- Four-Wheeler (Car): Base fare of ₹50 for the first day, plus ₹10 per day for each subsequent day.
- Two-Wheeler (Bike): Base fare of ₹20 for the first day, plus ₹5 per day for each subsequent day.
- Duration: Bookings can be requested for 1 to 30 days. Final bill is calculated upon checkout based on actual stay duration.`
    },
    {
        id: 'booking_process',
        keywords: ['book', 'booking', 'reserve', 'reservation', 'how to book', 'make a booking', 'request slot'],
        topic: 'How to Book a Parking Slot',
        content: `To book a parking slot in ParkSmart:
1. Log in to your driver account (you must be logged in to book).
2. Go to the Booking Page (/booking).
3. Filter slots by floor, zone, or vehicle type ('Car' or 'Bike').
4. Click on an 'Available' slot to open the booking modal.
5. Fill in vehicle number, owner name, phone number, vehicle type, optional vehicle model, and requested duration (1 to 30 days).
6. Submit the booking request.
7. The booking request is initially in 'Pending' status until approved by an administrator. Once approved, the status becomes 'Active' and the slot is marked 'Occupied'.`
    },
    {
        id: 'booking_requirements',
        keywords: ['information required', 'what information', 'what do i need', 'booking details', 'required fields', 'details needed'],
        topic: 'Information Required for Booking',
        content: `The following information is required to book a slot:
- Selected Slot ID (an available slot matching your vehicle type)
- Vehicle Number (2 to 15 alphanumeric characters, e.g., MH12AB1234)
- Vehicle Type ('Car' or 'Bike')
- Owner Name
- Phone Number
- Requested Duration (whole number between 1 and 30 days)
- Optional: Vehicle Model (e.g., Honda City, Activa)`
    },
    {
        id: 'view_bookings',
        keywords: ['view bookings', 'my bookings', 'check booking', 'where are my bookings', 'find booking', 'history', 'pass'],
        topic: 'Viewing Your Bookings',
        content: `You can view all your bookings by visiting the Driver Dashboard (/dashboard):
- Active Parking Passes: Shows currently active sessions with live elapsed timers.
- Pending Requests: Shows requests waiting for admin approval.
- Booking History: Displays past completed, cancelled, or rejected bookings with timestamps and digital receipts.`
    },
    {
        id: 'cancellation',
        keywords: ['cancel', 'cancellation', 'cancel booking', 'cancel request', 'refund', 'cancellation fee'],
        topic: 'Cancelling a Booking',
        content: `To cancel a booking:
- You can cancel a booking only while its status is 'Pending' (before admin approval).
- Open the Driver Dashboard (/dashboard) and click 'Cancel' on the pending booking card.
- There are no cancellation fees for cancelling a pending booking.
- Once a booking is 'Active' (vehicle parked), you cannot cancel it; instead, you end the session via checkout.`
    },
    {
        id: 'checkout_end',
        keywords: ['end booking', 'checkout', 'leave', 'exit', 'complete booking', 'finish parking'],
        topic: 'Ending a Parking Session & Checkout',
        content: `To end a parking session:
- Visit your Driver Dashboard (/dashboard).
- Click 'Checkout / End Session' on your Active Parking Pass.
- The system calculates the final amount based on actual elapsed duration and displays your digital receipt.
- The parking slot is immediately released and returned to 'Available' status.`
    },
    {
        id: 'facility_info',
        keywords: ['location', 'where are you', 'address', 'hours', 'operating hours', 'open', 'timing', 'contact', 'support', 'phone'],
        topic: 'Facility Hub & Operating Hours',
        content: `Facility Details:
- Location: Central Parking Complex, Multi-Level Bays Floor 1 & 2.
- Operating Hours: Open 24/7, 365 Days.
- Support Phone: +91 98765 43210.`
    },
    {
        id: 'unsupported_facts',
        keywords: ['payment method', 'credit card', 'upi', 'cash', 'valet', 'ev charging', 'electric vehicle charging', 'car wash'],
        topic: 'Unintegrated / Unverified Services',
        content: `Note on additional services:
- Online payment gateways (credit card, UPI, net banking integration) are not currently integrated into ParkSmart; billing is tracked digitally by the system upon checkout.
- Special EV charging bays, valet parking, and car wash services are not currently part of the ParkSmart system.`
    }
];

/**
 * Normalizes text for keyword matching.
 */
const normalizeText = (text) => {
    return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Lightweight FAQ retrieval:
 * Scores each FAQ item against user message and recent conversation turns.
 * Returns the most relevant FAQ knowledge as a formatted string.
 *
 * @param {string} query - Current user query
 * @param {Array} history - Prior conversation history
 * @returns {string} Retained authoritative FAQ knowledge
 */
const retrieveRelevantFAQ = (query, history = []) => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return '';

    // Include recent user messages from history to maintain context
    const recentUserContext = (history || [])
        .filter(item => item && item.role === 'user' && typeof item.content === 'string')
        .slice(-2)
        .map(item => normalizeText(item.content))
        .join(' ');

    const combinedQuery = `${recentUserContext} ${normalizedQuery}`.trim();
    const queryTokens = combinedQuery.split(' ').filter(token => token.length > 2);

    const scoredItems = PARKSMART_FAQ_ITEMS.map((item) => {
        let score = 0;

        // 1. Exact keyword phrase match (highest weight)
        for (const kw of item.keywords) {
            if (combinedQuery.includes(kw)) {
                score += 8;
            }
        }

        // 2. Token overlap with keywords
        for (const kw of item.keywords) {
            const kwTokens = kw.split(' ');
            for (const token of queryTokens) {
                if (kwTokens.includes(token)) {
                    score += 2;
                }
            }
        }

        // 3. Token match in content / topic
        const normalizedTopic = normalizeText(item.topic);
        for (const token of queryTokens) {
            if (normalizedTopic.includes(token)) {
                score += 2;
            }
        }

        return { item, score };
    });

    // Filter items with positive score and sort by relevance
    const relevant = scoredItems
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score);

    // If matches found, select top 3 most relevant items
    if (relevant.length > 0) {
        const topMatches = relevant.slice(0, 3).map(r => `### ${r.item.topic}\n${r.item.content}`);
        return topMatches.join('\n\n');
    }

    // Default general context if no specific topic scored
    const defaultOverview = PARKSMART_FAQ_ITEMS.find(i => i.id === 'overview');
    return defaultOverview ? `### ${defaultOverview.topic}\n${defaultOverview.content}` : '';
};

module.exports = {
    PARKSMART_FAQ_ITEMS,
    retrieveRelevantFAQ
};
