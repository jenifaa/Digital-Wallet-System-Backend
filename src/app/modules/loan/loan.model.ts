import { model, Schema } from "mongoose";
import { ILoan, LoanStatus } from "./loan.interface";

const loanSchema = new Schema<ILoan>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.PENDING,
      index: true,
    },
    interestRate: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
    repaidAt: { type: Date },
    repaidAmount: { type: Number, default: 0 },
    referenceId: { type: String, required: true, unique: true },
  },
  { timestamps: true, versionKey: false },
);

export const Loan = model<ILoan>("Loan", loanSchema);
