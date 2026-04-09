"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionIdParamSchema = exports.cashOutSchema = exports.cashInSchema = exports.sendMoneySchema = exports.withdrawSchema = exports.addMoneySchema = void 0;
const zod_1 = require("zod");
const transaction_interface_1 = require("./transaction.interface");
exports.addMoneySchema = zod_1.z.object({
    amount: zod_1.z.number().min(1, "Amount must be greater than 0"),
    type: zod_1.z.literal(transaction_interface_1.TransactionType.ADD),
    fee: zod_1.z.number().min(0).optional(),
    pin: zod_1.z.string().min(4, "PIN must be at least 4 digits"),
});
exports.withdrawSchema = zod_1.z.object({
    amount: zod_1.z.number().min(1, "Amount must be greater than 0"),
    type: zod_1.z.literal(transaction_interface_1.TransactionType.WITHDRAW),
    fee: zod_1.z.number().min(0).optional(),
    pin: zod_1.z.string().min(4, "PIN must be at least 4 digits"),
});
exports.sendMoneySchema = zod_1.z.object({
    receiver: zod_1.z.string(),
    amount: zod_1.z.number().min(1, "Amount must be greater than 0"),
    type: zod_1.z.literal(transaction_interface_1.TransactionType.SEND),
    fee: zod_1.z.number().min(0).optional(),
    commission: zod_1.z.number().min(0).optional(),
    pin: zod_1.z.string().min(4, "PIN must be at least 4 digits"),
});
exports.cashInSchema = zod_1.z.object({
    receiver: zod_1.z.string(),
    amount: zod_1.z.number().min(1, "Amount must be greater than 0"),
    type: zod_1.z.literal(transaction_interface_1.TransactionType.CASH_IN),
    fee: zod_1.z.number().min(0).optional(),
    commission: zod_1.z.number().min(0).optional(),
    pin: zod_1.z.string().min(4, "PIN must be at least 4 digits"),
});
exports.cashOutSchema = zod_1.z.object({
    agent: zod_1.z.string(),
    amount: zod_1.z.number().min(1, "Amount must be greater than 0"),
    type: zod_1.z.literal(transaction_interface_1.TransactionType.CASH_OUT),
    fee: zod_1.z.number().min(0).optional(),
    commission: zod_1.z.number().min(0).optional(),
    pin: zod_1.z.string().min(4, "PIN must be at least 4 digits"),
});
exports.transactionIdParamSchema = zod_1.z.object({
    id: zod_1.z.string(),
});
