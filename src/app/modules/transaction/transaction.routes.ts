import {
  addMoneySchema,
  cashInSchema,
  cashOutSchema,
  sendMoneySchema,
  withdrawSchema,
} from "./transaction.validation";
import express from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { transactionController } from "./transaction.controller";
import { requireWalletPin } from "../../middlewares/requireWalletPin";

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
  requireWalletPin,
  validateRequest(addMoneySchema),
  transactionController.AddMoney,
);

router.post(
  "/withdraw",
  checkAuth(Role.USER, Role.AGENT),
  requireWalletPin,
  validateRequest(withdrawSchema),
  transactionController.Withdraw,
);

router.post(
  "/send-money",
  checkAuth(Role.USER, Role.AGENT),
  requireWalletPin,
  validateRequest(sendMoneySchema),
  transactionController.SendMoney,
);



// Cash In (Agent → User)
router.post(
  "/cash-in",
  checkAuth(Role.AGENT),
  requireWalletPin,
  validateRequest(cashInSchema),
  transactionController.CashIn,
);

// Cash Out (Agent → User)
router.post(
  "/cash-out",
  checkAuth(Role.USER, Role.AGENT),
  requireWalletPin,
  validateRequest(cashOutSchema),
  transactionController.CashOut,
);


router.get(
  "/my-transactions",
  checkAuth(...Object.values(Role)),
  transactionController.GetMyTransactions,
);


export const TransactionRoutes = router;
