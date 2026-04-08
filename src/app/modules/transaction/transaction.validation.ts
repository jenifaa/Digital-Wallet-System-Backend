import { z } from "zod";
import { TransactionType } from "./transaction.interface";


export const addMoneySchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  type: z.literal(TransactionType.ADD),
  fee: z.number().min(0).optional(),
});

export const withdrawSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  type: z.literal(TransactionType.WITHDRAW),
  fee: z.number().min(0).optional(),
});

export const sendMoneySchema = z.object({
  receiver: z.string(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  type: z.literal(TransactionType.SEND),
  fee: z.number().min(0).optional(),
  commission: z.number().min(0).optional(),
});

export const cashInSchema = z.object({
  receiver: z.string(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  type: z.literal(TransactionType.CASH_IN),
  fee: z.number().min(0).optional(),
  commission: z.number().min(0).optional(),
});

export const cashOutSchema = z.object({
  agent:z.string(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  type: z.literal(TransactionType.CASH_OUT),
  fee: z.number().min(0).optional(),
  commission: z.number().min(0).optional(),
});

export const transactionIdParamSchema = z.object({
  id: z.string(),
});
