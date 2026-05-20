/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export enum TransactionType {
  ADD = "ADD",
  WITHDRAW = "WITHDRAW",
  SEND = "SEND",
  CASH_IN = "CASH_IN",
  CASH_OUT = "CASH_OUT",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REVERSED = "REVERSED",
}

export enum TransactionEntry {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export const AGENT_COMMISSION_PERCENT = 2;
export interface ITransaction {
  _id?: Types.ObjectId;
  sender?: Types.ObjectId;
  receiver?: Types.ObjectId | string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  transactionId: string;
  referenceId?: string;
  entry?: TransactionEntry;
  paymentGatewayData?: any;
  invoiceUrl?: string;
  fee?: number;
  processedAt?: Date;
  commission?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
