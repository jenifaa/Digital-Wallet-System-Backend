"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettings = void 0;
const mongoose_1 = require("mongoose");
const settings_interface_1 = require("./settings.interface");
const settingsSchema = new mongoose_1.Schema({
    minimumWalletBalance: { type: Number, default: settings_interface_1.DEFAULT_SETTINGS.minimumWalletBalance, min: 0 },
    sendMoneyLimit: { type: Number, default: settings_interface_1.DEFAULT_SETTINGS.sendMoneyLimit, min: 0 },
    withdrawLimit: { type: Number, default: settings_interface_1.DEFAULT_SETTINGS.withdrawLimit, min: 0 },
    loanLimit: { type: Number, default: settings_interface_1.DEFAULT_SETTINGS.loanLimit, min: 0 },
    transactionFee: { type: Number, default: settings_interface_1.DEFAULT_SETTINGS.transactionFee, min: 0 },
    cashOutFee: { type: Number, default: settings_interface_1.DEFAULT_SETTINGS.cashOutFee, min: 0 },
    agentCommissionPercent: { type: Number, default: settings_interface_1.DEFAULT_SETTINGS.agentCommissionPercent, min: 0 },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true, versionKey: false });
exports.SystemSettings = (0, mongoose_1.model)("SystemSettings", settingsSchema);
