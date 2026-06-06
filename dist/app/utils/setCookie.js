"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = exports.clearAuthCookies = void 0;
const cookieOptions_1 = require("./cookieOptions");
const clearAuthCookies = (res) => {
    res.clearCookie("accessToken", cookieOptions_1.clearAuthCookieOptions);
    res.clearCookie("refreshToken", cookieOptions_1.clearAuthCookieOptions);
};
exports.clearAuthCookies = clearAuthCookies;
const setAuthCookie = (res, tokenInfo) => {
    (0, exports.clearAuthCookies)(res);
    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken, cookieOptions_1.accessTokenCookieOptions);
    }
    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, cookieOptions_1.refreshTokenCookieOptions);
    }
};
exports.setAuthCookie = setAuthCookie;
