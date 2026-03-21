// import mongoose from "mongoose";
import { Wallet } from "./wallet.model";
import { WalletStatus } from "./wallet.interface";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";

//
// 👤 Get Wallet by User ID
//
const getWalletByUser = async (userId: string) => {
  const wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }

  return wallet;
};

//
// 💰 Add Money (User top-up)
//
const addMoney = async (userId: string, amount: number) => {
  const wallet = await Wallet.findOne({ user: userId });

  if (!wallet) throw new AppError(404, "Wallet not found");

  if (wallet.status === WalletStatus.BLOCKED) {
    throw new AppError(400, "Wallet is blocked");
  }

  wallet.balance += amount;
  wallet.lastTransactionAt = new Date();

  await wallet.save();

  return wallet;
};

//
// 💸 Withdraw Money (User)
//
// const withdraw = async (userId: string, amount: number) => {
//   const wallet = await Wallet.findOne({ user: userId });

//   if (!wallet) throw new AppError(404, "Wallet not found");

//   if (wallet.status === WalletStatus.BLOCKED) {
//     throw new AppError(400, "Wallet is blocked");
//   }

//   if (wallet.balance < amount) {
//     throw new AppError(400, "Insufficient balance");
//   }

//   wallet.balance -= amount;
//   wallet.lastTransactionAt = new Date();

//   await wallet.save();

//   return wallet;
// };

//
// 🔁 Send Money (User → User)
//
// const sendMoney = async (
//   senderId: string,
//   receiverId: string,
//   amount: number
// ) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const senderWallet = await Wallet.findOne({ user: senderId }).session(session);
//     const receiverWallet = await Wallet.findOne({ user: receiverId }).session(session);

//     if (!senderWallet || !receiverWallet) {
//       throw new AppError(404, "Sender or receiver wallet not found");
//     }

//     if (senderWallet.status === WalletStatus.BLOCKED) {
//       throw new AppError(400, "Sender wallet is blocked");
//     }

//     if (receiverWallet.status === WalletStatus.BLOCKED) {
//       throw new AppError(400, "Receiver wallet is blocked");
//     }

//     if (senderWallet.balance < amount) {
//       throw new AppError(400, "Insufficient balance");
//     }

//     // 💸 Transfer
//     senderWallet.balance -= amount;
//     receiverWallet.balance += amount;

//     senderWallet.lastTransactionAt = new Date();
//     receiverWallet.lastTransactionAt = new Date();

//     await senderWallet.save({ session });
//     await receiverWallet.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     return {
//       message: "Money sent successfully",
//     };
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };

//
// 🏦 Agent Cash-In
//
// const cashIn = async (agentId: string, userId: string, amount: number) => {
//   const userWallet = await Wallet.findOne({ user: userId });

//   if (!userWallet) throw new AppError(404, "User wallet not found");

//   if (userWallet.status === WalletStatus.BLOCKED) {
//     throw new AppError(400, "User wallet is blocked");
//   }

//   userWallet.balance += amount;
//   userWallet.lastTransactionAt = new Date();

//   await userWallet.save();

//   return userWallet;
// };

//
// 🏧 Agent Cash-Out
//
// const cashOut = async (agentId: string, userId: string, amount: number) => {
//   const userWallet = await Wallet.findOne({ user: userId });

//   if (!userWallet) throw new AppError(404, "User wallet not found");

//   if (userWallet.status === WalletStatus.BLOCKED) {
//     throw new AppError(400, "User wallet is blocked");
//   }

//   if (userWallet.balance < amount) {
//     throw new AppError(400, "Insufficient balance");
//   }

//   userWallet.balance -= amount;
//   userWallet.lastTransactionAt = new Date();

//   await userWallet.save();

//   return userWallet;
// };

//
// 👑 Admin: Update Wallet Status
//
// const updateWalletStatus = async (
//   walletId: string,
//   status: WalletStatus
// ) => {
//   const wallet = await Wallet.findById(walletId);

//   if (!wallet) throw new AppError(404, "Wallet not found");

//   wallet.status = status;

//   await wallet.save();

//   return wallet;
// };

//
// 👑 Admin: Get All Wallets
//
// const getAllWallets = async () => {
//   return Wallet.find({});
// };

//
// 👑 Admin: Get Single Wallet
//
// const getSingleWallet = async (walletId: string) => {
//   const wallet = await Wallet.findById(walletId);

//   if (!wallet) throw new AppError(404, "Wallet not found");

//   return wallet;
// };

export const walletService = {
  getWalletByUser,
  addMoney,
  // withdraw,
  // sendMoney,
  // cashIn,
  // cashOut,
  // updateWalletStatus,
  // getAllWallets,
  // getSingleWallet,
};