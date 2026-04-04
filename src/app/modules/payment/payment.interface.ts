/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export enum PAYMENT_STATUS {
  SUCCESS = "SUCCESS",

  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}
export interface IPayment {
  name: Types.ObjectId;
  transactionId: string;
  amount: number;
  paymentGatewayData?: any;
  invoiceUrl?: string;
  status: PAYMENT_STATUS;
}
