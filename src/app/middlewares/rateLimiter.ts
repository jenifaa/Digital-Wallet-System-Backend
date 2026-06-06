import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import AppError from "../errorHelpers/AppError";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const cleanupExpired = () => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
};

export const rateLimiter =
  (maxRequests: number, windowMs: number, keyPrefix = "rl") =>
  (req: Request, _res: Response, next: NextFunction) => {
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
      return next(
        new AppError(
          httpStatus.TOO_MANY_REQUESTS,
          "Too many requests. Please try again later.",
        ),
      );
    }

    existing.count += 1;
    store.set(key, existing);
    return next();
  };

export const authRateLimiter = rateLimiter(10, 15 * 60 * 1000, "auth");
export const otpRateLimiter = rateLimiter(5, 10 * 60 * 1000, "otp");
export const transactionRateLimiter = rateLimiter(30, 60 * 1000, "txn");
