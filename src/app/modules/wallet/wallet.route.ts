import express from "express";
import { WalletController } from "./wallet.controller";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

router.get(
  "/me",
  checkAuth(...Object.values(Role)),
  WalletController.getMyWallet,
);

router.get(
  "/all-wallet",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletController.getAllWallets,
);

router.patch(
  "/block/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletController.blockWallet,
);

router.patch(
  "/unblock/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  WalletController.unblockWallet,
);

router.post(
  "/pin/set",
  checkAuth(...Object.values(Role)),
  WalletController.setPin,
);

router.post("/pin/forgot", WalletController.forgetPin);
router.post("/pin/reset", WalletController.resetPin);

export const WalletRoutes = router;
