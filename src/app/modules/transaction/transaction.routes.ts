import express from "express";

import { validateRequest } from "../../middlewares/validateRequest";

import {
  addMoneyZodSchema,

} from "./transaction.validation";

const router = express.Router();


router.post(
  "/add-money",

  validateRequest(addMoneyZodSchema),
  TransactionController.addMoney
);


// router.post(
//   "/withdraw",
//   auth("user"),
//   validateRequest(withdrawZodSchema),
//   TransactionController.withdraw
// );


// router.post(
//   "/send-money",
//   auth("user"),
//   validateRequest(sendMoneyZodSchema),
//   TransactionController.sendMoney
// );


// router.get(
//   "/me",
//   auth("user", "agent"),
//   TransactionController.getMyTransactions
// );

// ---------------- AGENT ROUTES ----------------

// Cash In (Agent → User)
// router.post(
//   "/cash-in",
//   auth("agent"),
//   validateRequest(cashInZodSchema),
//   TransactionController.cashIn
// );

// Cash Out (Agent → User)
// router.post(
//   "/cash-out",
//   auth("agent"),
//   validateRequest(cashOutZodSchema),
//   TransactionController.cashOut
// );


// router.get(
//   "/",
//   auth("admin"),
//   TransactionController.getAllTransactions
// );

// Update Transaction Status
// router.patch(
//   "/:id/status",
//   auth("admin"),
//   validateRequest(updateTransactionStatusZodSchema),
//   TransactionController.updateTransactionStatus
// );

export const TransactionRoutes = router;