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
  "/",
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

export const WalletRoutes = router;
