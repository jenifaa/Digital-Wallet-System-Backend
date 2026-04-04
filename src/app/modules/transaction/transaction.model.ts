import { Schema, model, Types } from "mongoose";
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from "./transaction.interface";

const transactionSchema = new Schema<ITransaction>(
  {
    sender: { type: Types.ObjectId, ref: "User" },
    receiver: { type: Types.ObjectId, ref: "User" },
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be at least 1"],
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentGatewayData: {
      type: Schema.Types.Mixed,
    },
    invoiceUrl: {
      type: String,
    },
    fee: { type: Number, default: 0, min: [0, "Fee cannot be negative"] },
    // commission: {
    //   type: Number,
    //   default: 0,
    //   min: [0, "Commission cannot be negative"],
    // },
  },
  {
    timestamps: true,
  },
);

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema,
);


