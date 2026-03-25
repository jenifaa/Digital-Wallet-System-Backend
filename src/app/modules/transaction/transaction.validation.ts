import z from "zod";

// ---------------- ENUMS ----------------
export const TransactionTypeEnum = z.enum([
  "ADD_MONEY",
  "WITHDRAW",
  "SEND_MONEY",
  "CASH_IN",
  "CASH_OUT",
]);

export const TransactionStatusEnum = z.enum([
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REVERSED",
]);

// ---------------- COMMON ----------------
const amountField = z
  .number()
  .min(1, { message: "Amount must be at least 1" });

// Optional ObjectId validator (recommended)
const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid ObjectId format" });

// ---------------- USER ----------------

// Add Money (Top-up)
export const addMoneyZodSchema = z.object({
  amount: amountField,
});

// Withdraw
export const withdrawZodSchema = z.object({
  amount: amountField,
});

// Send Money
export const sendMoneyZodSchema = z.object({
  receiverId: objectId,
  amount: amountField,
});

// ---------------- AGENT ----------------

// Cash In (agent → user)
export const cashInZodSchema = z.object({
  userId: objectId,
  amount: amountField,
});

// Cash Out (agent → user)
export const cashOutZodSchema = z.object({
  userId: objectId,
  amount: amountField,
});

// ---------------- ADMIN (OPTIONAL) ----------------

// Update Transaction Status
export const updateTransactionStatusZodSchema = z.object({
  status: TransactionStatusEnum,
});