import {
  addMoneySchema,
  cashInSchema,
  cashOutSchema,
  sendMoneySchema,
} from "./transaction.validation";
import express from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { transactionController } from "./transaction.controller";

const router = express.Router();

// SSLCommerz callback compatibility (some envs point to /api/transaction/*)
router.get("/success", transactionController.successCallback);
router.post("/success", transactionController.successCallback);
router.get("/fail", transactionController.failCallback);
router.post("/fail", transactionController.failCallback);
router.get("/cancel", transactionController.cancelCallback);
router.post("/cancel", transactionController.cancelCallback);

router.post(
  "/add-money",
  checkAuth(...Object.values(Role)),
  validateRequest(addMoneySchema),
  transactionController.AddMoney,
);

// router.post(
//   "/withdraw",
//   auth("user"),
//   validateRequest(withdrawZodSchema),
//   TransactionController.withdraw
// );

router.post(
  "/send-money",
  checkAuth(Role.USER, Role.AGENT),
  validateRequest(sendMoneySchema),
  transactionController.SendMoney,
);

// router.get(
//   "/me",
//   auth("user", "agent"),
//   TransactionController.getMyTransactions
// );

// ---------------- AGENT ROUTES ----------------

// Cash In (Agent → User)
router.post(
  "/cash-in",
  checkAuth(Role.AGENT),
  validateRequest(cashInSchema),
  transactionController.CashIn,
);

// Cash Out (Agent → User)
router.post(
  "/cash-out",
  checkAuth(Role.USER, Role.AGENT),
  validateRequest(cashOutSchema),
  transactionController.CashOut,
);

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
