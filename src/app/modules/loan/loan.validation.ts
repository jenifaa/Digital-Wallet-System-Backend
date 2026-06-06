import { z } from "zod";

export const requestLoanSchema = z.object({
  amount: z.number().min(1),
});

export const rejectLoanSchema = z.object({
  reason: z.string().optional(),
});

export const repayLoanSchema = z.object({
  amount: z.number().min(1).optional(),
});

export const loanIdParamSchema = z.object({
  id: z.string().min(1),
});
