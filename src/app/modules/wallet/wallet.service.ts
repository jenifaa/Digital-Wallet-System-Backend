import mongoose from "mongoose";
import { Wallet } from "./wallet.model";
import { IWallet, WalletStatus } from "./wallet.interface";
import { User } from "../user/user.model";

interface TransactionOptions {
  session?: mongoose.ClientSession;
}

class WalletService {
  //
  // 👤 Get Wallet by owner ID
  //
  async getWalletByOwner(ownerId: string, ownerRole: "USER" | "AGENT") {
    const wallet = await Wallet.findOne({ owner: ownerId, ownerRole });
    if (!wallet) throw new Error("Wallet not found");
    return wallet;
  }

  //
  // 💰 Add Money (User top-up)
  //
  async addMoney(ownerId: string, amount: number) {
    const wallet = await Wallet.findOne({ owner: ownerId });
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.status === WalletStatus.BLOCKED)
      throw new Error("Wallet is blocked");

    wallet.balance += amount;
    wallet.lastTransactionAt = new Date();
    await wallet.save();
    return wallet;
  }

  //
  // 💸 Withdraw Money (User)
  //
  async withdraw(ownerId: string, amount: number) {
    const wallet = await Wallet.findOne({ owner: ownerId });
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.status === WalletStatus.BLOCKED)
      throw new Error("Wallet is blocked");
    if (wallet.balance < amount)
      throw new Error("Insufficient balance");

    wallet.balance -= amount;
    wallet.lastTransactionAt = new Date();
    await wallet.save();
    return wallet;
  }

  //
  // 🔁 Send Money (User to User)
  //
  async sendMoney(senderId: string, receiverId: string, amount: number) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const senderWallet = await Wallet.findOne({ owner: senderId }).session(session);
      const receiverWallet = await Wallet.findOne({ owner: receiverId }).session(session);

      if (!senderWallet || !receiverWallet)
        throw new Error("Sender or receiver wallet not found");

      if (senderWallet.status === WalletStatus.BLOCKED)
        throw new Error("Sender wallet is blocked");

      if (receiverWallet.status === WalletStatus.BLOCKED)
        throw new Error("Receiver wallet is blocked");

      if (senderWallet.balance < amount)
        throw new Error("Insufficient balance");

      // Update balances
      senderWallet.balance -= amount;
      receiverWallet.balance += amount;

      senderWallet.lastTransactionAt = new Date();
      receiverWallet.lastTransactionAt = new Date();

      await senderWallet.save({ session });
      await receiverWallet.save({ session });

      await session.commitTransaction();
      session.endSession();

      return { senderWallet, receiverWallet };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  //
  // 🏦 Agent Cash-In (Add money to user wallet)
  //
  async cashIn(agentId: string, userId: string, amount: number) {
    // Optional: track agent commission here
    const userWallet = await Wallet.findOne({ owner: userId });
    if (!userWallet) throw new Error("User wallet not found");
    if (userWallet.status === WalletStatus.BLOCKED)
      throw new Error("User wallet is blocked");

    userWallet.balance += amount;
    userWallet.lastTransactionAt = new Date();
    await userWallet.save();
    return userWallet;
  }

  //
  // 🏧 Agent Cash-Out (Withdraw money from user wallet)
  //
  async cashOut(agentId: string, userId: string, amount: number) {
    const userWallet = await Wallet.findOne({ owner: userId });
    if (!userWallet) throw new Error("User wallet not found");
    if (userWallet.status === WalletStatus.BLOCKED)
      throw new Error("User wallet is blocked");
    if (userWallet.balance < amount)
      throw new Error("Insufficient balance");

    userWallet.balance -= amount;
    userWallet.lastTransactionAt = new Date();
    await userWallet.save();
    return userWallet;
  }

  //
  // 👑 Admin: Update Wallet Status
  //
  async updateWalletStatus(walletId: string, status: WalletStatus) {
    const wallet = await Wallet.findById(walletId);
    if (!wallet) throw new Error("Wallet not found");

    wallet.status = status;
    await wallet.save();
    return wallet;
  }

  //
  // 👑 Admin: Get All Wallets
  //
  async getAllWallets() {
    return Wallet.find({});
  }

  //
  // 👑 Admin: Get Single Wallet
  //
  async getSingleWallet(walletId: string) {
    const wallet = await Wallet.findById(walletId);
    if (!wallet) throw new Error("Wallet not found");
    return wallet;
  }
}

export const walletService = new WalletService();