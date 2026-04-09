/* eslint-disable @typescript-eslint/no-explicit-any */

import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { Transaction } from "../transaction/transaction.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";

const now = new Date();
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);


// ================= USER STATS =================
const getUserStats = async () => {
  const [
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    usersByRole,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: IsActive.ACTIVE }),
    User.countDocuments({ isActive: IsActive.INACTIVE }),
    User.countDocuments({ isActive: IsActive.BLOCKED }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.aggregate([
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
};


const getWalletStats = async () => {
  const [
    totalWallets,
    avgBalance,
    totalBalance,
    walletStatusStats,
  ] = await Promise.all([
    // total wallets
    Wallet.countDocuments(),

    // average balance
    Wallet.aggregate([
      {
        $group: {
          _id: null,
          avgBalance: { $avg: "$balance" },
        },
      },
    ]),

    // total balance in system
    Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
        },
      },
    ]),

    // 🔥 STATUS BREAKDOWN
    Wallet.aggregate([
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
    avgBalance: avgBalance[0]?.avgBalance || 0,
    totalBalance: totalBalance[0]?.totalBalance || 0,

    walletStatusStats,
  };
};

const getTransactionStats = async () => {
  const [
    totalTransactions,
    totalTransactionByStatus,
    transactionsLast7Days,
    transactionsLast30Days,
    totalUniqueUsers,
    highestTransactions,
  ] = await Promise.all([
    Transaction.countDocuments(),

    Transaction.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    Transaction.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Transaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

    Transaction.distinct("user").then((users) => users.length),

    Transaction.find().sort({ amount: -1 }).limit(5),
  ]);

  return {
    totalTransactions,
    totalTransactionByStatus,
    transactionsLast7Days,
    transactionsLast30Days,
    totalUniqueUsers,
    highestTransactions,
  };
};



const getPaymentStats = async () => {
  const [
    totalPayments,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount,
  ] = await Promise.all([
    Payment.countDocuments(),

    Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    Payment.aggregate([
      {
        $match: { status: PAYMENT_STATUS.SUCCESS },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]),

    Payment.aggregate([
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
    totalRevenue: totalRevenue[0]?.totalRevenue || 0,
    avgPaymentAmount: avgPaymentAmount[0]?.avgPaymentAmount || 0,
  };
};


export const StatsService = {
  getUserStats,
  getWalletStats,
  getTransactionStats,
  getPaymentStats,
};