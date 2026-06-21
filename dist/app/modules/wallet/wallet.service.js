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
exports.walletService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const wallet_constant_1 = require("./wallet.constant");
const wallet_model_1 = require("./wallet.model");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const wallet_interface_1 = require("./wallet.interface");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const emailService_1 = require("../../utils/emailService");
const user_model_1 = require("../user/user.model");
const getMyWallet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findOne({ user: userId });
    if (!wallet) {
        throw new Error("Wallet not found");
    }
    return wallet;
});
const getAllWallets = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(wallet_model_1.Wallet.find().populate("user", "name email"), query);
    const wallets = yield queryBuilder
        .search(wallet_constant_1.walletSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();
    const [data, meta] = yield Promise.all([wallets.build(), wallets.getMeta()]);
    return {
        data,
        meta,
    };
});
const blockWallet = (walletId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingWallet = yield wallet_model_1.Wallet.findById(walletId);
    if (!existingWallet) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found.");
    }
    return yield wallet_model_1.Wallet.findByIdAndUpdate(walletId, { status: wallet_interface_1.WalletStatus.BLOCKED }, { new: true });
});
const unblockWallet = (walletId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingWallet = yield wallet_model_1.Wallet.findById(walletId);
    if (!existingWallet) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found.");
    }
    return yield wallet_model_1.Wallet.findByIdAndUpdate(walletId, { status: wallet_interface_1.WalletStatus.ACTIVE }, { new: true });
});
const normalizePin = (pin) => String(pin !== null && pin !== void 0 ? pin : "").trim();
const setPinForUser = (userId, pin) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const normalized = normalizePin(pin);
    if (!/^\d{4,}$/.test(normalized)) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "PIN must be at least 4 digits");
    }
    const wallet = yield wallet_model_1.Wallet.findOne({ user: userId }).select("+security.pinHash security.isPinSet");
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    }
    if ((_a = wallet.security) === null || _a === void 0 ? void 0 : _a.isPinSet) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "PIN already set. Use forgot/reset PIN to change it.");
    }
    const hashedPin = yield bcryptjs_1.default.hash(normalized, 10);
    wallet.security = Object.assign(Object.assign({}, (wallet.security || {})), { pinHash: hashedPin, isPinSet: true });
    yield wallet.save();
    return { message: "PIN set successfully" };
});
const forgetPin = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ email }).select("_id name email isVerified");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Email does not exist");
    }
    if (!user.isVerified) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is not verified");
    }
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        purpose: "PIN_RESET",
    };
    const resetToken = jsonwebtoken_1.default.sign(jwtPayload, env_1.envVars.JWT_ACCESS_SECRET, {
        expiresIn: "10m",
    });
    const resetUILink = `${env_1.envVars.FRONTEND_URL}/reset-pin?id=${user._id}&token=${resetToken}`;
    yield emailService_1.emailService.sendPinReset(user.email, user.name, resetUILink);
    return { message: "Email sent successfully" };
});
const resetPin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, token, newPin } = payload;
    if (!id || !token) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid reset request");
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, env_1.envVars.JWT_ACCESS_SECRET);
    }
    catch (_a) {
        throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Invalid or expired token");
    }
    if (String(decoded.userId) !== String(id) || decoded.purpose !== "PIN_RESET") {
        throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Invalid or expired token");
    }
    const normalized = normalizePin(newPin);
    if (!/^\d{4,}$/.test(normalized)) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "PIN must be at least 4 digits");
    }
    const wallet = yield wallet_model_1.Wallet.findOne({ user: id }).select("+security.pinHash security.isPinSet");
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    }
    const hashedPin = yield bcryptjs_1.default.hash(normalized, 10);
    wallet.security = Object.assign(Object.assign({}, (wallet.security || {})), { pinHash: hashedPin, isPinSet: true });
    yield wallet.save();
    return { message: "PIN reset successfully" };
});
exports.walletService = {
    getMyWallet,
    getAllWallets,
    blockWallet,
    unblockWallet,
    setPinForUser,
    forgetPin,
    resetPin,
};
