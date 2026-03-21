import express from "express";

// import { validateRequest } from "../../middlewares/validateRequest";

import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { WalletController } from "./wallet.controller";

const router = express.Router();

router.post("/add-money", checkAuth(Role.USER), WalletController.addMoney);

// Withdraw Money
// router.post(
//   "/withdraw",
//   checkAuth(Role.USER),
//   validateRequest(WalletValidation.withdrawSchema),
// withdraw
// );

// Send Money
// router.post(
//   "/send-money",
//   checkAuth(Role.USER),
//   validateRequest(WalletValidation.sendMoneySchema),
//   sendMoney
// );

// Get My Wallet
router.get(
  "/me",
  checkAuth(...Object.values(Role)),
  WalletController.getMyWallet,
);

// Get My Transactions
// router.get(
//   "/transactions",
//   checkAuth(Role.USER, Role.AGENT),
//  getMyTransactions
// );

// Cash In (add money to user)
// router.post(
//   "/cash-in",
//   checkAuth(Role.AGENT),
//   validateRequest(WalletValidation.cashInSchema),
// cashIn
// );

// Cash Out (withdraw from user)
// router.post(
//   "/cash-out",
//   checkAuth(Role.AGENT),
//   validateRequest(WalletValidation.cashOutSchema),
// cashOut
// );

// Get All Wallets
// router.get(
//   "/",
//   checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
// getAllWallets
// );

// Get Single Wallet
// router.get(
//   "/:walletId",
//   checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
//   validateRequest(WalletValidation.getWalletSchema),
// getSingleWallet
// );

// Block / Unblock Wallet
// router.patch(
//   "/:walletId/status",
//   checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
//   validateRequest(WalletValidation.updateWalletStatusSchema),
//  updateWalletStatus
// );

export const WalletRoutes = router;
