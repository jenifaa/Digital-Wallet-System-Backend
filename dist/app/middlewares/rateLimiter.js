"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRateLimiter = exports.otpRateLimiter = exports.authRateLimiter = exports.rateLimiter = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const store = new Map();
const cleanupExpired = () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) {
            store.delete(key);
        }
    }
};
const rateLimiter = (maxRequests, windowMs, keyPrefix = "rl") => (req, _res, next) => {
    cleanupExpired();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}:${req.path}`;
    const now = Date.now();
    const existing = store.get(key);
    if (!existing || existing.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return next();
    }
    if (existing.count >= maxRequests) {
        return next(new AppError_1.default(http_status_codes_1.default.TOO_MANY_REQUESTS, "Too many requests. Please try again later."));
    }
    existing.count += 1;
    store.set(key, existing);
    return next();
};
exports.rateLimiter = rateLimiter;
exports.authRateLimiter = (0, exports.rateLimiter)(10, 15 * 60 * 1000, "auth");
exports.otpRateLimiter = (0, exports.rateLimiter)(5, 10 * 60 * 1000, "otp");
exports.transactionRateLimiter = (0, exports.rateLimiter)(30, 60 * 1000, "txn");
