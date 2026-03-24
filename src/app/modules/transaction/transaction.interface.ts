import { Types } from "mongoose";

export type TTransactionType =
  | "ADD_MONEY"
  | "WITHDRAW"
  | "SEND_MONEY"
  | "CASH_IN"
  | "CASH_OUT";

export type TTransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED";

export interface ITransaction {
  _id?: Types.ObjectId;

  // Who initiated the transaction
  initiatedBy: Types.ObjectId;

  // Sender wallet/user
  from?: Types.ObjectId;

  // Receiver wallet/user
  to?: Types.ObjectId;

  // Amount transferred
  amount: number;

  // Optional fee (system)
  fee?: number;

  // Optional agent commission
  commission?: number;

  // Transaction type
  type: TTransactionType;

  // Status of transaction
  status: TTransactionStatus;

  // Optional reference (for tracking/logging)
  reference?: string;

  // Description (optional)
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
