import { Types } from "mongoose";

export enum LoanStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REPAID = "REPAID",
}

export interface ILoan {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  status: LoanStatus;
  interestRate?: number;
  dueDate?: Date;
  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;
  rejectionReason?: string;
  repaidAt?: Date;
  repaidAmount?: number;
  referenceId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
