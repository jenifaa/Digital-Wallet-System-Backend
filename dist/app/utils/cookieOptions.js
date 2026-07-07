"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookieOptions = exports.refreshTokenCookieOptions = exports.accessTokenCookieOptions = void 0;
// const isProduction = envVars.NODE_ENV === "production";
exports.accessTokenCookieOptions = {
    httpOnly: true,
    secure: true,
    // sameSite: isProduction ? "none" : "lax",
    sameSite: "none",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
};
exports.refreshTokenCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
exports.clearAuthCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};
