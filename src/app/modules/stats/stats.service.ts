/* eslint-disable @typescript-eslint/no-explicit-any */

import { Loan } from "../loan/loan.model";
import { LoanStatus } from "../loan/loan.interface";
import {
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.interface";
import { Transaction } from "../transaction/transaction.model";
import { AgentStatus, IsActive, Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";

const now = new Date();
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

const getUserStats = async () => {
  const [
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
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: IsActive.ACTIVE }),
    User.countDocuments({ isActive: IsActive.INACTIVE }),
    User.countDocuments({ isActive: IsActive.BLOCKED }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.countDocuments({ role: Role.AGENT }),
    User.countDocuments({ role: Role.AGENT, agentStatus: AgentStatus.APPROVED }),
    User.countDocuments({ role: Role.AGENT, agentStatus: AgentStatus.PENDING }),
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
};

const getWalletStats = async () => {
  const [totalWallets, avgBalance, totalBalance, walletStatusStats] =
    await Promise.all([
      Wallet.countDocuments(),
      Wallet.aggregate([{ $group: { _id: null, avgBalance: { $avg: "$balance" } } }]),
      Wallet.aggregate([{ $group: { _id: null, totalBalance: { $sum: "$balance" } } }]),
      Wallet.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

  return {
    totalWallets,
    avgBalance: avgBalance[0]?.avgBalance || 0,
    totalBalance: totalBalance[0]?.totalBalance || 0,
    walletStatusStats,
  };
};

const getTransactionStats = async () => {
  const [
    totalTransactions,
    totalTransactionByStatus,
    transactionsByType,
    transactionsLast7Days,
    transactionsLast30Days,
    totalUniqueUsersAgg,
    highestTransactions,
    totalVolumeAgg,
    totalFeesAgg,
  ] = await Promise.all([
    Transaction.countDocuments(),
    Transaction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Transaction.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
    Transaction.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Transaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Transaction.aggregate([
      { $project: { users: ["$sender", "$receiver"] } },
      { $unwind: "$users" },
      { $match: { users: { $ne: null } } },
      { $group: { _id: "$users" } },
      { $count: "count" },
    ]),
    Transaction.find().sort({ amount: -1 }).limit(5),
    Transaction.aggregate([
      { $match: { status: TransactionStatus.SUCCESS } },
      { $group: { _id: null, totalVolume: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { status: TransactionStatus.SUCCESS } },
      { $group: { _id: null, totalFees: { $sum: "$fee" } } },
    ]),
  ]);

  return {
    totalTransactions,
    totalTransactionByStatus,
    transactionsByType,
    transactionsLast7Days,
    transactionsLast30Days,
    totalUniqueUsers: totalUniqueUsersAgg[0]?.count || 0,
    highestTransactions,
    totalVolume: totalVolumeAgg[0]?.totalVolume || 0,
    totalFees: totalFeesAgg[0]?.totalFees || 0,
  };
};

const getLoanStats = async () => {
  const [totalLoans, loansByStatus, totalLoanAmount, totalRepaid] =
    await Promise.all([
      Loan.countDocuments(),
      Loan.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Loan.aggregate([
        { $match: { status: { $in: [LoanStatus.APPROVED, LoanStatus.REPAID] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Loan.aggregate([
        { $group: { _id: null, total: { $sum: "$repaidAmount" } } },
      ]),
    ]);

  return {
    totalLoans,
    loansByStatus,
    totalLoanAmount: totalLoanAmount[0]?.total || 0,
    totalRepaid: totalRepaid[0]?.total || 0,
  };
};

const getDashboardOverview = async () => {
  const [userStats, walletStats, transactionStats, loanStats] = await Promise.all([
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
};

const getUserGrowthAnalytics = async () => {
  return User.aggregate([
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
};

const getTransactionGrowthAnalytics = async () => {
  return Transaction.aggregate([
    {
      $match: {
        status: TransactionStatus.SUCCESS,
        type: { $in: [TransactionType.SEND, TransactionType.ADD, TransactionType.WITHDRAW] },
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
};

export const StatsService = {
  getUserStats,
  getWalletStats,
  getTransactionStats,
  getLoanStats,
  getDashboardOverview,
  getUserGrowthAnalytics,
  getTransactionGrowthAnalytics,
};
