"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWalletPin = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const wallet_model_1 = require("../modules/wallet/wallet.model");
const requireWalletPin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const decodedToken = req.user;
    if (!(decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.userId)) {
        return next(new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Unauthorized"));
    }
    const pin = String((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.pin) !== null && _b !== void 0 ? _b : "").trim();
    if (!pin) {
        return next(new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "PIN is required"));
    }
    const wallet = yield wallet_model_1.Wallet.findOne({ user: decodedToken.userId }).select("+security.pinHash security.isPinSet");
    if (!wallet) {
        return next(new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found"));
    }
    if (!((_c = wallet.security) === null || _c === void 0 ? void 0 : _c.isPinSet) || !((_d = wallet.security) === null || _d === void 0 ? void 0 : _d.pinHash)) {
        return next(new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Please set wallet PIN before your first transaction"));
    }
    const ok = yield bcryptjs_1.default.compare(pin, wallet.security.pinHash);
    if (!ok) {
        return next(new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Invalid PIN"));
    }
    return next();
});
exports.requireWalletPin = requireWalletPin;
