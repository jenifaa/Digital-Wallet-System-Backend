"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const mongoose_1 = require("mongoose");
const wallet_interface_1 = require("./wallet.interface");
const walletSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    balance: {
        type: Number,
        default: 50,
        min: [0, "Balance cannot be negative"],
    },
    currency: {
        type: String,
        enum: Object.values(wallet_interface_1.Currency),
        default: wallet_interface_1.Currency.BDT,
    },
    status: {
        type: String,
        enum: Object.values(wallet_interface_1.WalletStatus),
        default: wallet_interface_1.WalletStatus.ACTIVE,
    },
    limits: {
        dailyLimit: {
            type: Number,
            default: 100000,
        },
        monthlyLimit: {
            type: Number,
            default: 1000000,
        },
    },
    security: {
        pinHash: {
            type: String,
            select: false,
        },
        isPinSet: {
            type: Boolean,
            default: false,
        },
    },
    lastTransactionAt: Date,
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    versionKey: false,
});
walletSchema.index({ user: 1 }, { unique: true });
exports.Wallet = (0, mongoose_1.model)("Wallet", walletSchema);
