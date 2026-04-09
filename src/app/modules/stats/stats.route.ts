import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { StatsController } from "./stats.controller";

const router = express.Router();

router.get(
  "/transaction",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getTransactionStats,
);
router.get(
  "/payment",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getPaymentStats,
);
router.get(
  "/user",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getUserStats,
);
router.get(
  "/wallet",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getWalletStats,
);

export const StatsRoutes = router;
