import { model, Schema } from "mongoose";
import { DEFAULT_SETTINGS, ISystemSettings } from "./settings.interface";

const settingsSchema = new Schema<ISystemSettings>(
  {
    minimumWalletBalance: { type: Number, default: DEFAULT_SETTINGS.minimumWalletBalance, min: 0 },
    sendMoneyLimit: { type: Number, default: DEFAULT_SETTINGS.sendMoneyLimit, min: 0 },
    withdrawLimit: { type: Number, default: DEFAULT_SETTINGS.withdrawLimit, min: 0 },
    loanLimit: { type: Number, default: DEFAULT_SETTINGS.loanLimit, min: 0 },
    transactionFee: { type: Number, default: DEFAULT_SETTINGS.transactionFee, min: 0 },
    cashOutFee: { type: Number, default: DEFAULT_SETTINGS.cashOutFee, min: 0 },
    agentCommissionPercent: { type: Number, default: DEFAULT_SETTINGS.agentCommissionPercent, min: 0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);

export const SystemSettings = model<ISystemSettings>("SystemSettings", settingsSchema);
