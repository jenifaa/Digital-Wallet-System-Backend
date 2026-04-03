import  bcryptjs  from 'bcryptjs';
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { walletSearchableFields } from "./wallet.constant";
import { Wallet } from "./wallet.model";
import { Types } from 'mongoose';

const getMyWallet = async (userId: string) => {
  const wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return wallet;
};

const getAllWallets = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Wallet.find(), query);
  const wallets = await queryBuilder
    .search(walletSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([wallets.build(), wallets.getMeta()]);
  return {
    data,
    meta,
  };
};

const blockWallet = async (walletId: string) => {
  const existingWallet = await Wallet.findById(walletId);
  if (!existingWallet) {
    throw new Error("Wallet not found.");
  }
  return await Wallet.findByIdAndUpdate(
    walletId,
    { isBlocked: true },
    { new: true },
  );
};

const unblockWallet = async (walletId: string) => {
  return await Wallet.findByIdAndUpdate(
    walletId,
    { isBlocked: false },
    { new: true },
  );
};

const setPin = async (walletId: string, pin: string) => {
  if (!pin || pin.length < 4) {
    throw new AppError(400, "PIN must be at least 4 digits");
  }

  const hashedPin = await bcryptjs.hash(pin, 10);

  const wallet = await Wallet.findByIdAndUpdate(
    walletId,
    {
      "security.pinHash": hashedPin,
      "security.isPinSet": true,
    },
    { new: true },
  );

  if (!wallet) {
    throw new AppError(404, "Wallet not found");
  }

  return { message: "PIN set successfully" };
};

const verifyPin = async (walletId: Types.ObjectId, pin: string) => {
  const wallet = await Wallet.findById(walletId);

  if (!wallet) {
    throw new AppError(404, "Wallet not found");
  }

  if (!wallet.security?.pinHash) {
    throw new AppError(400, "PIN not set yet");
  }

  const isValid = await bcryptjs.compare(pin, wallet.security.pinHash);
  if (!isValid) {
    throw new AppError(401, "Invalid PIN");
  }

  return { message: "PIN verified successfully" };
};
export const walletService = {
  getMyWallet,
  getAllWallets,
  blockWallet,
  unblockWallet,
  setPin,
  verifyPin,
};
