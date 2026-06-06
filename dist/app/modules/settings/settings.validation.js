"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingsSchema = void 0;
const zod_1 = require("zod");
exports.updateSettingsSchema = zod_1.z.object({
    minimumWalletBalance: zod_1.z.number().min(0).optional(),
    sendMoneyLimit: zod_1.z.number().min(0).optional(),
    withdrawLimit: zod_1.z.number().min(0).optional(),
    loanLimit: zod_1.z.number().min(0).optional(),
    transactionFee: zod_1.z.number().min(0).optional(),
    cashOutFee: zod_1.z.number().min(0).optional(),
    agentCommissionPercent: zod_1.z.number().min(0).max(100).optional(),
});
