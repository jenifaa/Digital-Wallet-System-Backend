import httpStatus from "http-status-codes";
import AppError from "../errorHelpers/AppError";
import { IsActive, IUser, Role } from "../modules/user/user.interface";
import { IWallet, WalletStatus } from "../modules/wallet/wallet.interface";
import { User } from "../modules/user/user.model";
import { Wallet } from "../modules/wallet/wallet.model";
import { AgentStatus } from "../modules/user/user.interface";

export const assertUserCanTransact = (user: Pick<IUser, "isActive" | "isDeleted">) => {
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User account is deleted");
  }
  if (user.isActive === IsActive.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User account is blocked");
  }
  if (user.isActive === IsActive.INACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User account is deactivated");
  }
};

export const assertWalletCanTransact = (
  wallet: Pick<IWallet, "status" | "isDeleted">,
  action: "send" | "receive" | "withdraw" | "cashout" | "payment" = "send",
) => {
  if (wallet.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "Wallet is deleted");
  }
  if (wallet.status === WalletStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, `Wallet is blocked and cannot ${action}`);
  }
  if (wallet.status === WalletStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, `Wallet is suspended and cannot ${action}`);
  }
};

export const assertAgentCanOperate = (
  user: Pick<IUser, "role" | "isAgentApproved" | "agentStatus">,
) => {
  if (user.role !== Role.AGENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not an agent");
  }
  if (user.agentStatus === AgentStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "Agent account is suspended");
  }
  if (user.agentStatus === AgentStatus.REJECTED) {
    throw new AppError(httpStatus.FORBIDDEN, "Agent application was rejected");
  }
  if (!user.isAgentApproved || user.agentStatus !== AgentStatus.APPROVED) {
    throw new AppError(httpStatus.FORBIDDEN, "Agent is not approved yet");
  }
};

export const validateUserAndWalletForTransaction = async (
  userId: string,
  options?: { requireReceive?: boolean; targetUserId?: string },
) => {
  const user = await User.findById(userId).select("isActive isDeleted role isAgentApproved agentStatus");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  assertUserCanTransact(user);

  const wallet = await Wallet.findOne({ user: userId }).select("status isDeleted balance");
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }
  assertWalletCanTransact(wallet, "send");

  if (options?.requireReceive && options.targetUserId) {
    const receiver = await User.findById(options.targetUserId).select("isActive isDeleted");
    if (!receiver) {
      throw new AppError(httpStatus.NOT_FOUND, "Receiver not found");
    }
    assertUserCanTransact(receiver);

    const receiverWallet = await Wallet.findOne({ user: options.targetUserId }).select("status isDeleted");
    if (!receiverWallet) {
      throw new AppError(httpStatus.NOT_FOUND, "Receiver wallet not found");
    }
    assertWalletCanTransact(receiverWallet, "receive");
  }

  return { user, wallet };
};
