import { Schema, model } from "mongoose";
import { IWallet, WalletStatus, Currency } from "./wallet.interface";


const walletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    balance: {
      type: Number,
      default: 50,
      min: [0, "Balance cannot be negative"],
    },

    currency: {
      type: String,
      enum: Object.values(Currency),
      default: Currency.BDT,
    },

    status: {
      type: String,
      enum: Object.values(WalletStatus),
      default: WalletStatus.ACTIVE,
    },

    limits: {
      dailyLimit: {
        type: Number,
        default: 100000,
      },
      monthlyLimit: {
        type: Number,
        default: 1000000,
      },
    },

    security: {
      pinHash: {
        type: String,
        select: false,
      },
      isPinSet: {
        type: Boolean,
        default: false,
      },
    },

    lastTransactionAt: Date,

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

walletSchema.index({ user: 1 }, { unique: true });

export const Wallet = model<IWallet>("Wallet", walletSchema);
