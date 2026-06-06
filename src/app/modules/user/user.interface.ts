import { Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
  AGENT = "AGENT",
}
export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}
export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export enum AgentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export interface IAgentStatusHistory {
  status: AgentStatus;
  changedBy?: Types.ObjectId;
  reason?: string;
  changedAt: Date;
}
export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  picture?: string;
  address?: string;
  isDeleted?: boolean;
  isActive?: IsActive;
  isVerified?: boolean;
  isAgentApproved?: boolean;
  agentStatus?: AgentStatus;
  agentStatusHistory?: IAgentStatusHistory[];
  role: Role;
  auths: IAuthProvider[];
  wallet?: Types.ObjectId;
  transaction?: Types.ObjectId[];
  agents?: Types.ObjectId[];
  createdAt?: Date;
}
