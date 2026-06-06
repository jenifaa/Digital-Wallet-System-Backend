import { model, Schema } from "mongoose";
import {
  AgentStatus,
  IAgentStatusHistory,
  IAuthProvider,
  IsActive,
  IUser,
  Role,
} from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false,
  },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String },
    role: { type: String, enum: Object.values(Role), default: Role.USER },
    phone: { type: String, unique: true, sparse: true },
    picture: { type: String },
    address: { type: String },
    isDeleted: { type: Boolean, default: false },
    isAgentApproved: { type: Boolean, default: false },
    agentStatus: {
      type: String,
      enum: Object.values(AgentStatus),
    },
    agentStatusHistory: [
      {
        status: { type: String, enum: Object.values(AgentStatus), required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reason: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ] as unknown as IAgentStatusHistory[],
    isActive: {
      type: String,
      enum: Object.values(IsActive),
      default: IsActive.ACTIVE,
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
    },
    isVerified: { type: Boolean, default: false },
    auths: [authProviderSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const User = model<IUser>("User", userSchema);
