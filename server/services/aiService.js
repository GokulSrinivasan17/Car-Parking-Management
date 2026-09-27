const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const { GoogleGenAI } = require('@google/genai');

/**
 * Builds controlled ParkSmart AI System Instruction with injected verified FAQ context.
 *
 * @param {string} faqContext - Authoritative facts extracted from codebase
 * @returns {string} System instruction string
 */
const buildSystemInstruction = (faqContext = '') => {
    return `You are ParkSmart AI, the friendly and knowledgeable AI assistant for the ParkSmart parking management system.

Your job is to communicate naturally and help users understand ParkSmart.

AUTHORITATIVE PARKSMART FACTS:
${faqContext || 'ParkSmart is a smart parking management system for vehicle slot reservations, live tracking, and digital parking passes.'}

STRICT OPERATIONAL RULES:
1. Use the authoritative ParkSmart facts above as your sole factual source for ParkSmart-specific features, rates, processes, and policies.
2. NEVER invent ParkSmart facts. If a user asks about a specific feature, policy, payment method, or service not described in the authoritative facts, clearly state that you do not have verified information for that topic rather than guessing.
3. You are NOT allowed to claim that you checked live parking availability. If asked whether a specific slot is available (e.g. "Is slot A1 available?"), explain that live availability checking is not connected yet, and guide the user to check real-time availability on the Home page or Booking page (/booking).
4. You are NOT allowed to create, modify, or cancel bookings in this phase. If a user asks you to book a slot (e.g. "Book slot A1"), explain that direct booking through ParkSmart AI is not connected yet, and explain the steps to book via the /booking page.
5. Communicate warmly, clearly, and concisely. Maintain conversational continuity across multi-turn exchanges.`;
};

class AIError extends Error {
    constructor(message, statusCode = 500, code = 'AI_ERROR') {
        super(message);
        this.name = 'AIError';
        this.statusCode = statusCode;
        this.code = code;
    }
}

let aiClient = null;

/**
 * Initializes and returns the GoogleGenAI instance.
 * Reuses client instance across requests.
 */
const getClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new AIError('AI service is not configured with an API key', 503, 'MISSING_API_KEY');
    }
    if (!aiClient) {
        aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
};

/**
 * Resolves the configured Gemini model or falls back to a sensible free-tier model.
 */
const getModelName = () => {
    return process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
};

/**
 * Converts client conversation history into Gemini contents format.
 * Maps 'assistant' role to Gemini's 'model' role.
 */
const formatContents = (message, history = []) => {
    const contents = [];

    // Append validated history
    for (const item of history) {
        if (!item || typeof item.content !== 'string' || !item.content.trim()) continue;
        const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
        contents.push({
            role,
            parts: [{ text: item.content.trim() }]
        });
    }

    // Append current user message
    contents.push({
        role: 'user',
        parts: [{ text: message.trim() }]
    });

    return contents;
};

/**
 * Sends conversation to Google Gemini and returns assistant text.
 * Handles rate limits, network faults, and provider errors securely.
 *
 * @param {string} message - Current user message
 * @param {Array} history - Prior conversation history
 * @param {string} faqContext - Authoritative facts extracted from codebase
 * @returns {Promise<string>} Assistant response text
 */
const generateChatResponse = async (message, history = [], faqContext = '') => {
    try {
        const client = getClient();
        const model = getModelName();
        const contents = formatContents(message, history);

        const response = await client.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction: buildSystemInstruction(faqContext),
                temperature: 0.7,
                maxOutputTokens: 1000
            }
        });

        const reply = response && response.text ? response.text.trim() : null;

        if (!reply) {
            return "I apologize, but I couldn't generate a response for that. How else can I assist you with ParkSmart?";
        }

        return reply;
    } catch (err) {
        // Safe classification of errors without exposing API keys or secrets
        const errString = `${err.message || ''} ${err.status || ''} ${err.code || ''}`.toLowerCase();

        // 1. Rate limiting / Free-tier exhaustion
        if (
            err.status === 429 ||
            errString.includes('429') ||
            errString.includes('resource_exhausted') ||
            errString.includes('rate limit') ||
            errString.includes('quota')
        ) {
            throw new AIError('ParkSmart AI is temporarily busy. Please try again in a moment.', 429, 'RATE_LIMIT');
        }

        // 2. Missing configuration / Auth with provider
        if (err.code === 'MISSING_API_KEY' || err.status === 401 || err.status === 403) {
            throw new AIError('Sorry, I am having trouble connecting right now. Please try again.', 503, 'AUTH_ERROR');
        }

        // 3. Network or timeout issues
        if (
            errString.includes('fetch failed') ||
            errString.includes('enotfound') ||
            errString.includes('etimedout') ||
            errString.includes('econnrefused') ||
            errString.includes('network')
        ) {
            throw new AIError("Sorry, I'm having trouble connecting right now. Please try again.", 503, 'NETWORK_ERROR');
        }

        // 4. Fallback generic error
        throw new AIError("Sorry, I'm having trouble connecting right now. Please try again.", 500, 'PROVIDER_ERROR');
    }
};

module.exports = {
    generateChatResponse,
    AIError
};
