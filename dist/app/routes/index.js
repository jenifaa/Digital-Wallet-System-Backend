"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_route_1 = require("../modules/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const wallet_route_1 = require("../modules/wallet/wallet.route");
const transaction_routes_1 = require("../modules/transaction/transaction.routes");
const otp_route_1 = require("../modules/otp/otp.route");
const stats_route_1 = require("../modules/stats/stats.route");
const loan_route_1 = require("../modules/loan/loan.route");
const notification_route_1 = require("../modules/notification/notification.route");
const settings_route_1 = require("../modules/settings/settings.route");
const audit_route_1 = require("../modules/audit/audit.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    { path: "/user", route: user_route_1.UserRoutes },
    { path: "/auth", route: auth_route_1.AuthRoutes },
    { path: "/wallet", route: wallet_route_1.WalletRoutes },
    { path: "/transaction", route: transaction_routes_1.TransactionRoutes },
    { path: "/otp", route: otp_route_1.OtpRoutes },
    { path: "/stat", route: stats_route_1.StatsRoutes },
    { path: "/loan", route: loan_route_1.LoanRoutes },
    { path: "/notification", route: notification_route_1.NotificationRoutes },
    { path: "/settings", route: settings_route_1.SettingsRoutes },
    { path: "/audit", route: audit_route_1.AuditRoutes },
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
