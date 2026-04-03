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

export interface ITransaction {
  _id?: Types.ObjectId;
  sender?: Types.ObjectId;
  receiver?: Types.ObjectId;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  transactionId: string;
  paymentGatewayData?: any;
  invoiceUrl?: string;
  fee?: number;
  commission?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
