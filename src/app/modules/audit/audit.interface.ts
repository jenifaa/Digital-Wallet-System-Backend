import { Types } from "mongoose";

export enum AuditAction {
  USER_BLOCK = "USER_BLOCK",
  USER_UNBLOCK = "USER_UNBLOCK",
  WALLET_BLOCK = "WALLET_BLOCK",
  WALLET_UNBLOCK = "WALLET_UNBLOCK",
  LOAN_APPROVE = "LOAN_APPROVE",
  LOAN_REJECT = "LOAN_REJECT",
  LOAN_REPAY = "LOAN_REPAY",
  AGENT_APPROVE = "AGENT_APPROVE",
  AGENT_REJECT = "AGENT_REJECT",
  AGENT_SUSPEND = "AGENT_SUSPEND",
  AGENT_REACTIVATE = "AGENT_REACTIVATE",
  SETTINGS_UPDATE = "SETTINGS_UPDATE",
  NOTIFICATION_SEND = "NOTIFICATION_SEND",
  TRANSACTION = "TRANSACTION",
  LOGIN = "LOGIN",
}

export interface IAuditLog {
  _id?: Types.ObjectId;
  action: AuditAction;
  performedBy?: Types.ObjectId;
  targetType?: string;
  targetId?: Types.ObjectId | string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt?: Date;
}
