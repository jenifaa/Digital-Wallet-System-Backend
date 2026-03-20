import { Types } from "mongoose";
import { Role } from "../user/user.interface";

export enum WalletStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
  SUSPENDED = "SUSPENDED",
}

export enum Currency {
  BDT = "BDT",
}

export interface IWalletLimits {
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface IWalletSecurity {
  pinHash?: string;
  isPinSet?: boolean;
}

export interface IWallet {
  _id?: Types.ObjectId;
  owner: Types.ObjectId;
  role: Role.USER | Role.AGENT;
  balance: number;
  currency: Currency;
  status: WalletStatus;
  limits?: IWalletLimits;
  security?: IWalletSecurity;
  lastTransactionAt?: Date;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

