/**
 * In-memory sliding-window rate limiter for ParkSmart AI endpoints.
 * Protects against spam, automated denial of service, and Gemini API abuse.
 * 
 * Default Limit: 30 requests per 60 seconds per IP address.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;     // 30 requests per window

const ipRequestMap = new Map();

// Periodic cleanup of expired rate limit entries to prevent memory leaks
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRequestMap.entries()) {
        if (now > entry.resetTime) {
            ipRequestMap.delete(ip);
        }
    }
}, 2 * 60 * 1000);

if (cleanupTimer.unref) {
    cleanupTimer.unref();
}

/**
 * Express middleware for rate limiting AI endpoints.
 */
const aiRateLimiter = (req, res, next) => {
    // Identify client by IP (or user ID if available)
    const clientKey = req.user ? `user_${req.user._id}` : (req.ip || req.connection.remoteAddress || 'unknown_ip');
    const now = Date.now();

    const record = ipRequestMap.get(clientKey);

    if (!record || now > record.resetTime) {
        // First request or window expired
        ipRequestMap.set(clientKey, {
            count: 1,
            resetTime: now + WINDOW_MS
        });
        return next();
    }

    if (record.count >= MAX_REQUESTS) {
        // Return HTTP 429 without leaking internal infrastructure details
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please slow down and try again shortly.'
        });
    }

    record.count += 1;
    return next();
};

/**
 * Resets the rate limiter store (useful for automated testing)
 */
const resetRateLimiter = () => {
    ipRequestMap.clear();
};

module.exports = {
    aiRateLimiter,
    resetRateLimiter,
    RATE_LIMIT_CONFIG: {
        windowMs: WINDOW_MS,
        maxRequests: MAX_REQUESTS
    }
};
