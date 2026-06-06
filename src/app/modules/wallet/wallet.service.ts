/* eslint-disable @typescript-eslint/no-explicit-any */
import  bcryptjs  from 'bcryptjs';
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { walletSearchableFields } from "./wallet.constant";
import { Wallet } from "./wallet.model";
import httpStatus from "http-status-codes";
import { WalletStatus } from "./wallet.interface";
import jwt from "jsonwebtoken";
import { envVars } from "../../config/env";
import { emailService } from "../../utils/emailService";
import { User } from '../user/user.model';

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
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found.");
  }
  return await Wallet.findByIdAndUpdate(
    walletId,
    { status: WalletStatus.BLOCKED },
    { new: true },
  );
};

const unblockWallet = async (walletId: string) => {
  const existingWallet = await Wallet.findById(walletId);
  if (!existingWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found.");
  }
  return await Wallet.findByIdAndUpdate(
    walletId,
    { status: WalletStatus.ACTIVE },
    { new: true },
  );
};

const normalizePin = (pin: string) => String(pin ?? "").trim();

const setPinForUser = async (userId: string, pin: string) => {
  const normalized = normalizePin(pin);
  if (!/^\d{4,}$/.test(normalized)) {
    throw new AppError(httpStatus.BAD_REQUEST, "PIN must be at least 4 digits");
  }

  const wallet = await Wallet.findOne({ user: userId }).select(
    "+security.pinHash security.isPinSet",
  );
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }

  if (wallet.security?.isPinSet) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "PIN already set. Use forgot/reset PIN to change it.",
    );
  }

  const hashedPin = await bcryptjs.hash(normalized, 10);
  wallet.security = {
    ...(wallet.security || {}),
    pinHash: hashedPin,
    isPinSet: true,
  };
  await wallet.save();

  return { message: "PIN set successfully" };
};

const forgetPin = async (email: string) => {
  const user = await User.findOne({ email }).select("_id name email isVerified");
  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email does not exist");
  }
  if (!user.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
  }

  const jwtPayload = {
    userId: user._id,
    email: user.email,
    purpose: "PIN_RESET",
  };
  const resetToken = jwt.sign(jwtPayload, envVars.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });

  const resetUILink = `${envVars.FRONTEND_URL}/reset-pin?id=${user._id}&token=${resetToken}`;

  await emailService.sendPinReset(user.email, user.name, resetUILink);

  return { message: "Email sent successfully" };
};

const resetPin = async (payload: { id: string; token: string; newPin: string }) => {
  const { id, token, newPin } = payload;
  if (!id || !token) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid reset request");
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, envVars.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
  }

  if (String(decoded.userId) !== String(id) || decoded.purpose !== "PIN_RESET") {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
  }

  const normalized = normalizePin(newPin);
  if (!/^\d{4,}$/.test(normalized)) {
    throw new AppError(httpStatus.BAD_REQUEST, "PIN must be at least 4 digits");
  }

  const wallet = await Wallet.findOne({ user: id }).select("+security.pinHash security.isPinSet");
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }

  const hashedPin = await bcryptjs.hash(normalized, 10);
  wallet.security = {
    ...(wallet.security || {}),
    pinHash: hashedPin,
    isPinSet: true,
  };
  await wallet.save();

  return { message: "PIN reset successfully" };
};
export const walletService = {
  getMyWallet,
  getAllWallets,
  blockWallet,
  unblockWallet,
  setPinForUser,
  forgetPin,
  resetPin,
};
