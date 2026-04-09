"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const payment_interface_1 = require("../payment/payment.interface");
const payment_model_1 = require("../payment/payment.model");
const transaction_model_1 = require("../transaction/transaction.model");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const wallet_model_1 = require("../wallet/wallet.model");
const now = new Date();
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
// ================= USER STATS =================
const getUserStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const [totalUsers, totalActiveUsers, totalInActiveUsers, totalBlockedUsers, newUsersInLast7Days, newUsersInLast30Days, usersByRole,] = yield Promise.all([
        user_model_1.User.countDocuments(),
        user_model_1.User.countDocuments({ isActive: user_interface_1.IsActive.ACTIVE }),
        user_model_1.User.countDocuments({ isActive: user_interface_1.IsActive.INACTIVE }),
        user_model_1.User.countDocuments({ isActive: user_interface_1.IsActive.BLOCKED }),
        user_model_1.User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        user_model_1.User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        user_model_1.User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);
    return {
        totalUsers,
        totalActiveUsers,
        totalInActiveUsers,
        totalBlockedUsers,
        newUsersInLast7Days,
        newUsersInLast30Days,
        usersByRole,
    };
});
const getWalletStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const [totalWallets, avgBalance, totalBalance, walletStatusStats,] = yield Promise.all([
        // total wallets
        wallet_model_1.Wallet.countDocuments(),
        // average balance
        wallet_model_1.Wallet.aggregate([
            {
                $group: {
                    _id: null,
                    avgBalance: { $avg: "$balance" },
                },
            },
        ]),
        // total balance in system
        wallet_model_1.Wallet.aggregate([
            {
                $group: {
                    _id: null,
                    totalBalance: { $sum: "$balance" },
                },
            },
        ]),
        // 🔥 STATUS BREAKDOWN
        wallet_model_1.Wallet.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);
    return {
        totalWallets,
        avgBalance: ((_a = avgBalance[0]) === null || _a === void 0 ? void 0 : _a.avgBalance) || 0,
        totalBalance: ((_b = totalBalance[0]) === null || _b === void 0 ? void 0 : _b.totalBalance) || 0,
        walletStatusStats,
    };
});
const getTransactionStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const [totalTransactions, totalTransactionByStatus, transactionsByType, transactionsLast7Days, transactionsLast30Days, totalUniqueUsersAgg, highestTransactions,] = yield Promise.all([
        transaction_model_1.Transaction.countDocuments(),
        transaction_model_1.Transaction.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]),
        transaction_model_1.Transaction.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                },
            },
        ]),
        transaction_model_1.Transaction.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        transaction_model_1.Transaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        transaction_model_1.Transaction.aggregate([
            {
                $project: {
                    users: ["$sender", "$receiver"],
                },
            },
            { $unwind: "$users" },
            { $match: { users: { $ne: null } } },
            { $group: { _id: "$users" } },
            { $count: "count" },
        ]),
        transaction_model_1.Transaction.find().sort({ amount: -1 }).limit(5),
    ]);
    return {
        totalTransactions,
        totalTransactionByStatus,
        transactionsByType,
        transactionsLast7Days,
        transactionsLast30Days,
        totalUniqueUsers: ((_a = totalUniqueUsersAgg[0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
        highestTransactions,
    };
});
const getPaymentStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const [totalPayments, totalPaymentByStatus, totalRevenue, avgPaymentAmount,] = yield Promise.all([
        payment_model_1.Payment.countDocuments(),
        payment_model_1.Payment.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]),
        payment_model_1.Payment.aggregate([
            {
                $match: { status: payment_interface_1.PAYMENT_STATUS.SUCCESS },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                },
            },
        ]),
        payment_model_1.Payment.aggregate([
            {
                $group: {
                    _id: null,
                    avgPaymentAmount: { $avg: "$amount" },
                },
            },
        ]),
    ]);
    return {
        totalPayments,
        totalPaymentByStatus,
        totalRevenue: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0,
        avgPaymentAmount: ((_b = avgPaymentAmount[0]) === null || _b === void 0 ? void 0 : _b.avgPaymentAmount) || 0,
    };
});
exports.StatsService = {
    getUserStats,
    getWalletStats,
    getTransactionStats,
    getPaymentStats,
};
