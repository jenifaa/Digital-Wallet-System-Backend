"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loanIdParamSchema = exports.repayLoanSchema = exports.rejectLoanSchema = exports.requestLoanSchema = void 0;
const zod_1 = require("zod");
exports.requestLoanSchema = zod_1.z.object({
    amount: zod_1.z.number().min(1),
});
exports.rejectLoanSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
exports.repayLoanSchema = zod_1.z.object({
    amount: zod_1.z.number().min(1).optional(),
});
exports.loanIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
});
