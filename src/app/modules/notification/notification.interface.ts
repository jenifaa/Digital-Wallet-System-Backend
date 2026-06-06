import { Types } from "mongoose";

export enum NotificationType {
  SYSTEM = "SYSTEM",
  TRANSACTION = "TRANSACTION",
  LOAN = "LOAN",
  AGENT = "AGENT",
  ADMIN = "ADMIN",
  BROADCAST = "BROADCAST",
}

export interface INotification {
  _id?: Types.ObjectId;
  title: string;
  message: string;
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  type: NotificationType;
  read: boolean;
  createdAt?: Date;
}
