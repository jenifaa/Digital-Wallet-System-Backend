import express from "express";
import { WalletController } from "./wallet.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { WalletValidation } from "./wallet.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = express.Router();


router.post(
  "/add-money",
  checkAuth(Role.USER),
  validateRequest(WalletValidation.addMoneySchema),
  WalletController.addMoney
);

// Withdraw Money
router.post(
  "/withdraw",
  checkAuth(Role.USER),
  validateRequest(WalletValidation.withdrawSchema),
  WalletController.withdraw
);

// Send Money
router.post(
  "/send-money",
  checkAuth(Role.USER),
  validateRequest(WalletValidation.sendMoneySchema),
  WalletController.sendMoney
);

// Get My Wallet
router.get(
  "/me",
  checkAuth(Role.USER, Role.AGENT),
  WalletController.getMyWallet
);

// Get My Transactions
router.get(
  "/transactions",
  checkAuth(Role.USER, Role.AGENT),
  WalletController.getMyTransactions
);



// Cash In (add money to user)
router.post(
  "/cash-in",
  checkAuth(Role.AGENT),
  validateRequest(WalletValidation.cashInSchema),
  WalletController.cashIn
);

// Cash Out (withdraw from user)
router.post(
  "/cash-out",
  checkAuth(Role.AGENT),
  validateRequest(WalletValidation.cashOutSchema),
  WalletController.cashOut
);



// Get All Wallets
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletController.getAllWallets
);

// Get Single Wallet
router.get(
  "/:walletId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(WalletValidation.getWalletSchema),
  WalletController.getSingleWallet
);

// Block / Unblock Wallet
router.patch(
  "/:walletId/status",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(WalletValidation.updateWalletStatusSchema),
  WalletController.updateWalletStatus
);

export const WalletRoutes = router;