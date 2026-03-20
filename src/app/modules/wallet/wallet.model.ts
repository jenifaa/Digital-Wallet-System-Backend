import { Schema, model } from "mongoose";
import {
  IWallet,
  WalletStatus,
  Currency,
} from "./wallet.interface";
import { Role } from "../user/user.interface";

const walletSchema = new Schema<IWallet>(
  {
    // Owner reference
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },

    role: {
      type: String,
      enum: [Role.USER, Role.AGENT],
      required: true,
    },

 
    balance: {
      type: Number,
      required: true,
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

 
    lastTransactionAt: {
      type: Date,
    },


    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
     versionKey: false,
  }
);




export const Wallet = model<IWallet>("Wallet", walletSchema);