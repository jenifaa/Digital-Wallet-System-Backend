"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transaction_interface_1 = require("./transaction.interface");
const transactionSchema = new mongoose_1.Schema({
    sender: { type: mongoose_1.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose_1.Types.ObjectId, ref: "User" },
    amount: {
        type: Number,
        required: true,
        min: [1, "Amount must be at least 1"],
    },
    type: {
        type: String,
        enum: Object.values(transaction_interface_1.TransactionType),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(transaction_interface_1.TransactionStatus),
        default: transaction_interface_1.TransactionStatus.PENDING,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    referenceId: {
        type: String,
        index: true,
    },
    entry: {
        type: String,
        enum: Object.values(transaction_interface_1.TransactionEntry),
    },
    paymentGatewayData: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    invoiceUrl: {
        type: String,
    },
    fee: { type: Number, default: 0, min: [0, "Fee cannot be negative"] },
    processedAt: { type: Date },
    commission: {
        type: Number,
        default: 0,
        min: [0, "Commission cannot be negative"],
    },
}, {
    timestamps: true,
});
exports.Transaction = (0, mongoose_1.model)("Transaction", transactionSchema);
