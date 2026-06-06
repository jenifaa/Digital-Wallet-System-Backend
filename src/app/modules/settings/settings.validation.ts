import { z } from "zod";

export const updateSettingsSchema = z.object({
  minimumWalletBalance: z.number().min(0).optional(),
  sendMoneyLimit: z.number().min(0).optional(),
  withdrawLimit: z.number().min(0).optional(),
  loanLimit: z.number().min(0).optional(),
  transactionFee: z.number().min(0).optional(),
  cashOutFee: z.number().min(0).optional(),
  agentCommissionPercent: z.number().min(0).max(100).optional(),
});
