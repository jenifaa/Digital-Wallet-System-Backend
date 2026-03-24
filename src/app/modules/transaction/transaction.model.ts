import { Schema, model } from "mongoose";
import { ITransaction } from "./transaction.interface";

const transactionSchema = new Schema<ITransaction>(
  {
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be greater than 0"],
    },

    fee: {
      type: Number,
      default: 0,
    },

    commission: {
      type: Number,
      default: 0,
    },

    type: {
      type: String,
      enum: [
        "ADD_MONEY",
        "WITHDRAW",
        "SEND_MONEY",
        "CASH_IN",
        "CASH_OUT",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      default: "PENDING",
    },

    reference: {
      type: String,
      unique: true,
    },

    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: index for faster query
transactionSchema.index({ initiatedBy: 1 });
transactionSchema.index({ from: 1, to: 1 });
transactionSchema.index({ type: 1, status: 1 });

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema
);