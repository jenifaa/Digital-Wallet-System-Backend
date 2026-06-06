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
const loan_model_1 = require("../loan/loan.model");
const loan_interface_1 = require("../loan/loan.interface");
const transaction_interface_1 = require("../transaction/transaction.interface");
const transaction_model_1 = require("../transaction/transaction.model");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const wallet_model_1 = require("../wallet/wallet.model");
const now = new Date();
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const getUserStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const [totalUsers, totalActiveUsers, totalInActiveUsers, totalBlockedUsers, newUsersInLast7Days, newUsersInLast30Days, usersByRole, totalAgents, approvedAgents, pendingAgents,] = yield Promise.all([
        user_model_1.User.countDocuments(),
        user_model_1.User.countDocuments({ isActive: user_interface_1.IsActive.ACTIVE }),
        user_model_1.User.countDocuments({ isActive: user_interface_1.IsActive.INACTIVE }),
        user_model_1.User.countDocuments({ isActive: user_interface_1.IsActive.BLOCKED }),
        user_model_1.User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        user_model_1.User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        user_model_1.User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        user_model_1.User.countDocuments({ role: user_interface_1.Role.AGENT }),
        user_model_1.User.countDocuments({ role: user_interface_1.Role.AGENT, agentStatus: user_interface_1.AgentStatus.APPROVED }),
        user_model_1.User.countDocuments({ role: user_interface_1.Role.AGENT, agentStatus: user_interface_1.AgentStatus.PENDING }),
    ]);
    return {
        totalUsers,
        totalActiveUsers,
        totalInActiveUsers,
        totalBlockedUsers,
        newUsersInLast7Days,
        newUsersInLast30Days,
        usersByRole,
        totalAgents,
        approvedAgents,
        pendingAgents,
    };
});
const getWalletStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const [totalWallets, avgBalance, totalBalance, walletStatusStats] = yield Promise.all([
        wallet_model_1.Wallet.countDocuments(),
        wallet_model_1.Wallet.aggregate([{ $group: { _id: null, avgBalance: { $avg: "$balance" } } }]),
        wallet_model_1.Wallet.aggregate([{ $group: { _id: null, totalBalance: { $sum: "$balance" } } }]),
        wallet_model_1.Wallet.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    return {
        totalWallets,
        avgBalance: ((_a = avgBalance[0]) === null || _a === void 0 ? void 0 : _a.avgBalance) || 0,
        totalBalance: ((_b = totalBalance[0]) === null || _b === void 0 ? void 0 : _b.totalBalance) || 0,
        walletStatusStats,
    };
});
const getTransactionStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const [totalTransactions, totalTransactionByStatus, transactionsByType, transactionsLast7Days, transactionsLast30Days, totalUniqueUsersAgg, highestTransactions, totalVolumeAgg, totalFeesAgg,] = yield Promise.all([
        transaction_model_1.Transaction.countDocuments(),
        transaction_model_1.Transaction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        transaction_model_1.Transaction.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
        transaction_model_1.Transaction.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        transaction_model_1.Transaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        transaction_model_1.Transaction.aggregate([
            { $project: { users: ["$sender", "$receiver"] } },
            { $unwind: "$users" },
            { $match: { users: { $ne: null } } },
            { $group: { _id: "$users" } },
            { $count: "count" },
        ]),
        transaction_model_1.Transaction.find().sort({ amount: -1 }).limit(5),
        transaction_model_1.Transaction.aggregate([
            { $match: { status: transaction_interface_1.TransactionStatus.SUCCESS } },
            { $group: { _id: null, totalVolume: { $sum: "$amount" } } },
        ]),
        transaction_model_1.Transaction.aggregate([
            { $match: { status: transaction_interface_1.TransactionStatus.SUCCESS } },
            { $group: { _id: null, totalFees: { $sum: "$fee" } } },
        ]),
    ]);
    return {
        totalTransactions,
        totalTransactionByStatus,
        transactionsByType,
        transactionsLast7Days,
        transactionsLast30Days,
        totalUniqueUsers: ((_a = totalUniqueUsersAgg[0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
        highestTransactions,
        totalVolume: ((_b = totalVolumeAgg[0]) === null || _b === void 0 ? void 0 : _b.totalVolume) || 0,
        totalFees: ((_c = totalFeesAgg[0]) === null || _c === void 0 ? void 0 : _c.totalFees) || 0,
    };
});
const getLoanStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const [totalLoans, loansByStatus, totalLoanAmount, totalRepaid] = yield Promise.all([
        loan_model_1.Loan.countDocuments(),
        loan_model_1.Loan.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        loan_model_1.Loan.aggregate([
            { $match: { status: { $in: [loan_interface_1.LoanStatus.APPROVED, loan_interface_1.LoanStatus.REPAID] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        loan_model_1.Loan.aggregate([
            { $group: { _id: null, total: { $sum: "$repaidAmount" } } },
        ]),
    ]);
    return {
        totalLoans,
        loansByStatus,
        totalLoanAmount: ((_a = totalLoanAmount[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
        totalRepaid: ((_b = totalRepaid[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
    };
});
const getDashboardOverview = () => __awaiter(void 0, void 0, void 0, function* () {
    const [userStats, walletStats, transactionStats, loanStats] = yield Promise.all([
        getUserStats(),
        getWalletStats(),
        getTransactionStats(),
        getLoanStats(),
    ]);
    return {
        overview: {
            totalUsers: userStats.totalUsers,
            totalAgents: userStats.totalAgents,
            totalWallets: walletStats.totalWallets,
            totalTransactions: transactionStats.totalTransactions,
            totalTransactionVolume: transactionStats.totalVolume,
            totalLoans: loanStats.totalLoans,
            totalRevenue: transactionStats.totalFees,
        },
        userGrowth: {
            last7Days: userStats.newUsersInLast7Days,
            last30Days: userStats.newUsersInLast30Days,
            byRole: userStats.usersByRole,
        },
        transactionGrowth: {
            last7Days: transactionStats.transactionsLast7Days,
            last30Days: transactionStats.transactionsLast30Days,
            byType: transactionStats.transactionsByType,
            byStatus: transactionStats.totalTransactionByStatus,
        },
        loanStatistics: loanStats,
        walletStatistics: walletStats,
    };
});
const getUserGrowthAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    return user_model_1.User.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
    ]);
});
const getTransactionGrowthAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    return transaction_model_1.Transaction.aggregate([
        {
            $match: {
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                type: { $in: [transaction_interface_1.TransactionType.SEND, transaction_interface_1.TransactionType.ADD, transaction_interface_1.TransactionType.WITHDRAW] },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
                volume: { $sum: "$amount" },
            },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
    ]);
});
exports.StatsService = {
    getUserStats,
    getWalletStats,
    getTransactionStats,
    getLoanStats,
    getDashboardOverview,
    getUserGrowthAnalytics,
    getTransactionGrowthAnalytics,
};
