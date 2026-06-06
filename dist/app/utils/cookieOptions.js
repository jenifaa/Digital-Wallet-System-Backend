"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookieOptions = exports.refreshTokenCookieOptions = exports.accessTokenCookieOptions = void 0;
const env_1 = require("../config/env");
const isProduction = env_1.envVars.NODE_ENV === "production";
exports.accessTokenCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
};
exports.refreshTokenCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
exports.clearAuthCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
};
