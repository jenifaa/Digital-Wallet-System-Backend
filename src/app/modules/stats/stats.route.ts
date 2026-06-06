import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { StatsController } from "./stats.controller";

const router = express.Router();

router.get(
  "/dashboard",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getDashboardOverview,
);

router.get(
  "/transaction",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getTransactionStats,
);

router.get(
  "/loan",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getLoanStats,
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

router.get(
  "/user-growth",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getUserGrowthAnalytics,
);

router.get(
  "/transaction-growth",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getTransactionGrowthAnalytics,
);

export const StatsRoutes = router;
