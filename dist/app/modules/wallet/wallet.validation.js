"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWalletZodSchema = exports.createWalletZodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const wallet_interface_1 = require("./wallet.interface");
const user_interface_1 = require("../user/user.interface");
exports.createWalletZodSchema = zod_1.default.object({
    owner: zod_1.default
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, {
        message: "Invalid owner ID",
    }),
    role: zod_1.default.enum([user_interface_1.Role.USER, user_interface_1.Role.AGENT], {
        message: "Owner role must be USER or AGENT",
    }),
    balance: zod_1.default
        .number()
        .min(0, { message: "Balance cannot be negative" })
        .default(50),
    currency: zod_1.default
        .enum(Object.values(wallet_interface_1.Currency))
        .optional(),
    status: zod_1.default
        .enum(Object.values(wallet_interface_1.WalletStatus))
        .optional(),
    isDeleted: zod_1.default.boolean().optional(),
});
exports.updateWalletZodSchema = zod_1.default.object({
    balance: zod_1.default
        .number()
        .min(0, { message: "Balance cannot be negative" })
        .optional(),
    status: zod_1.default
        .enum(Object.values(wallet_interface_1.WalletStatus))
        .optional(),
    isDeleted: zod_1.default.boolean().optional(),
    limits: zod_1.default
        .object({
        dailyLimit: zod_1.default.number().min(0).optional(),
        monthlyLimit: zod_1.default.number().min(0).optional(),
    })
        .optional(),
    security: zod_1.default
        .object({
        pinHash: zod_1.default.string().optional(),
        isPinSet: zod_1.default.boolean().optional(),
    })
        .optional(),
});
