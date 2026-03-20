import z from "zod";
import { WalletStatus, Currency } from "./wallet.interface";
import { Role } from "../user/user.interface";


export const createWalletZodSchema = z.object({
  owner: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid owner ID",
    }),

  role: z.enum([Role.USER, Role.AGENT] as [string, ...string[]], {
    message: "Owner role must be USER or AGENT",
  }),

  balance: z
    .number()
    .min(0, { message: "Balance cannot be negative" })
    .default(50),

  currency: z
    .enum(Object.values(Currency) as [string, ...string[]])
    .optional(),

  status: z
    .enum(Object.values(WalletStatus) as [string, ...string[]])
    .optional(),

  isDeleted: z.boolean().optional(),
});


export const updateWalletZodSchema = z.object({
  balance: z
    .number()
    .min(0, { message: "Balance cannot be negative" })
    .optional(),

  status: z
    .enum(Object.values(WalletStatus) as [string, ...string[]])
    .optional(),

  isDeleted: z.boolean().optional(),


  limits: z
    .object({
      dailyLimit: z.number().min(0).optional(),
      monthlyLimit: z.number().min(0).optional(),
    })
    .optional(),

  security: z
    .object({
      pinHash: z.string().optional(),
      isPinSet: z.boolean().optional(),
    })
    .optional(),
});