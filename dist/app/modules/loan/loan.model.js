"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loan = void 0;
const mongoose_1 = require("mongoose");
const loan_interface_1 = require("./loan.interface");
const loanSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
        type: String,
        enum: Object.values(loan_interface_1.LoanStatus),
        default: loan_interface_1.LoanStatus.PENDING,
        index: true,
    },
    interestRate: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    rejectedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
    repaidAt: { type: Date },
    repaidAmount: { type: Number, default: 0 },
    referenceId: { type: String, required: true, unique: true },
}, { timestamps: true, versionKey: false });
exports.Loan = (0, mongoose_1.model)("Loan", loanSchema);
