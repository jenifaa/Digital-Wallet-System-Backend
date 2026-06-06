import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { WalletRoutes } from "../modules/wallet/wallet.route";
import { TransactionRoutes } from "../modules/transaction/transaction.routes";
import { OtpRoutes } from "../modules/otp/otp.route";
import { StatsRoutes } from "../modules/stats/stats.route";
import { LoanRoutes } from "../modules/loan/loan.route";
import { NotificationRoutes } from "../modules/notification/notification.route";
import { SettingsRoutes } from "../modules/settings/settings.route";
import { AuditRoutes } from "../modules/audit/audit.route";

export const router = Router();

const moduleRoutes = [
  { path: "/user", route: UserRoutes },
  { path: "/auth", route: AuthRoutes },
  { path: "/wallet", route: WalletRoutes },
  { path: "/transaction", route: TransactionRoutes },
  { path: "/otp", route: OtpRoutes },
  { path: "/stat", route: StatsRoutes },
  { path: "/loan", route: LoanRoutes },
  { path: "/notification", route: NotificationRoutes },
  { path: "/settings", route: SettingsRoutes },
  { path: "/audit", route: AuditRoutes },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
