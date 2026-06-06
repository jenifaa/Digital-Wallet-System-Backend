import { Types } from "mongoose";

export interface ISystemSettings {
  _id?: Types.ObjectId;
  minimumWalletBalance: number;
  sendMoneyLimit: number;
  withdrawLimit: number;
  loanLimit: number;
  transactionFee: number;
  cashOutFee: number;
  agentCommissionPercent: number;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_SETTINGS: Omit<ISystemSettings, "_id" | "updatedBy" | "createdAt" | "updatedAt"> = {
  minimumWalletBalance: 0,
  sendMoneyLimit: 50000,
  withdrawLimit: 50000,
  loanLimit: 100000,
  transactionFee: 5,
  cashOutFee: 5,
  agentCommissionPercent: 2,
};
