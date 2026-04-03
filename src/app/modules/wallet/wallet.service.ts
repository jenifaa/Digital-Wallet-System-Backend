import { QueryBuilder } from "../../utils/QueryBuilder";
import { walletSearchableFields } from "./wallet.constant";
import { Wallet } from "./wallet.model";

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

export const walletService = {
  getMyWallet,
  getAllWallets,
  blockWallet,
  unblockWallet,
};
