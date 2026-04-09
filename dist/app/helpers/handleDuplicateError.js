"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDuplicateError = void 0;
const handleDuplicateError = (err) => {
    var _a;
    const field = Object.keys(err.keyValue || {})[0];
    const value = (_a = err.keyValue) === null || _a === void 0 ? void 0 : _a[field];
    return {
        statusCode: 400,
        message: `Duplicate ${field}: ${value}`,
    };
};
exports.handleDuplicateError = handleDuplicateError;
