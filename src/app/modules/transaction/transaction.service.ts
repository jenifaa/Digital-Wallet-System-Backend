/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import {
  AGENT_COMMISSION_PERCENT,
  ITransaction,
  TransactionEntry,
  TransactionStatus,
  TransactionType,
} from "./transaction.interface";
import { Transaction } from "./transaction.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { Wallet } from "../wallet/wallet.model";
import { envVars } from "../../config/env";

const getTransactionId = () => {
  return `trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

const calculateFee = (amount: number) => {
  if (!amount || amount <= 0) return 0;
  // Project requirement per your latest message: fee should be 5 (even for 350)
  return 5;
};

const addMoney = async (payload: Partial<ITransaction>, userId: string) => {
  const transactionId = getTransactionId();
  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (!user.phone) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Please update your profile first",
      );
    }

    const fee = calculateFee(payload.amount as number);

    const totalPayable = (payload.amount as number) + fee;

    const transaction = await Transaction.create(
      [
        {
          sender: user._id,
          amount: payload.amount,
          fee,
          type: TransactionType.ADD,
          status: TransactionStatus.PENDING,
          transactionId: transactionId,
        },
      ],
      { session },
    );

    const sslPayload: ISSLCommerz = {
      amount: totalPayable,
      transactionId: transactionId,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
    const sslResponse = await SSLService.sslPaymentInit(sslPayload);

    if (sslResponse.status !== "SUCCESS") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        sslResponse.failedreason || "SSL payment initialization failed",
      );
    }
    await session.commitTransaction();
    session.endSession();

    return {
      message: "Redirect to payment gateway",
      paymentUrl: sslResponse.GatewayPageURL,
      transactionId,
    };
  } catch (error) {
    await session.abortTransaction(); // rollback
    session.endSession();
    throw error;
  }
};

const getSystemAdminWalletId = async (session: any) => {
  const admin = await User.findOne({ email: envVars.SUPER_ADMIN_EMAIL })
    .select("_id wallet")
    .session(session);
  if (!admin) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "System admin not found",
    );
  }
  if (!admin.wallet) {
    const wallet = await Wallet.create([{ user: admin._id }], { session });
    admin.wallet = wallet[0]._id;
    await admin.save({ session });
  }
  return admin.wallet;
};

const sendMoney = async (payload: Partial<ITransaction>, userId: string) => {
  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    const senderUser = await User.findById(userId).select("_id");
    if (!senderUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (!payload.receiver) {
      throw new AppError(httpStatus.BAD_REQUEST, "Receiver is required");
    }

    const receiverUser = await User.findById(payload.receiver).select("_id");
    if (!receiverUser) {
      throw new AppError(httpStatus.NOT_FOUND, "Receiver not found");
    }

    const amount = Number(payload.amount || 0);
    if (!amount || amount < 1) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
    }

    const fee = calculateFee(amount);
    const totalDebit = amount + fee;

    const debitRes = await Wallet.updateOne(
      { user: senderUser._id, balance: { $gte: totalDebit } },
      { $inc: { balance: -totalDebit }, $set: { lastTransactionAt: new Date() } },
      { session },
    );
    if (debitRes.matchedCount === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
    }

    const creditRes = await Wallet.updateOne(
      { user: receiverUser._id },
      { $inc: { balance: amount }, $set: { lastTransactionAt: new Date() } },
      { session },
    );
    if (creditRes.matchedCount === 0) {
      throw new AppError(httpStatus.NOT_FOUND, "Receiver wallet not found");
    }

    if (fee > 0) {
      const adminWalletId = await getSystemAdminWalletId(session);
      await Wallet.updateOne(
        { _id: adminWalletId },
        { $inc: { balance: fee }, $set: { lastTransactionAt: new Date() } },
        { session },
      );
    }

    const referenceId = getTransactionId();
    await Transaction.create(
      [
        {
          sender: senderUser._id,
          receiver: receiverUser._id,
          amount,
          fee,
          type: TransactionType.SEND,
          entry: TransactionEntry.DEBIT,
          referenceId,
          status: TransactionStatus.SUCCESS,
          transactionId: `${referenceId}_D`,
          processedAt: new Date(),
        },
        {
          sender: senderUser._id,
          receiver: receiverUser._id,
          amount,
          fee: 0,
          type: TransactionType.SEND,
          entry: TransactionEntry.CREDIT,
          referenceId,
          status: TransactionStatus.SUCCESS,
          transactionId: `${referenceId}_C`,
          processedAt: new Date(),
        },
      ],
      { session,ordered: true },
    );

    await session.commitTransaction();
    session.endSession();
    return { success: true, message: "Money sent successfully", referenceId };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const cashIn = async (payload: Partial<ITransaction>, agentId: string) => {
  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    const amount = Number(payload.amount || 0);
    if (!amount || amount < 1) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
    }
    if (!payload.receiver) {
      throw new AppError(httpStatus.BAD_REQUEST, "receiver required");
    }

    const agent = await User.findById(agentId).select("_id");
    const user = await User.findById(payload.receiver).select("_id");
    if (!agent) throw new AppError(httpStatus.NOT_FOUND, "Agent not found");
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    const fee = 0;
     const commission = Math.round((amount * AGENT_COMMISSION_PERCENT) / 100);
    const debitRes = await Wallet.updateOne(
      { user: agent._id, balance: { $gte: amount + fee } },
      { $inc: { balance: -(amount + fee) }, $set: { lastTransactionAt: new Date() } },
      { session },
    );
    if (debitRes.matchedCount === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Insufficient agent balance");
    }

    const creditRes = await Wallet.updateOne(
      { user: user._id },
      { $inc: { balance: amount }, $set: { lastTransactionAt: new Date() } },
      { session },
    );
    if (creditRes.matchedCount === 0) {
      throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
    }
        await Wallet.updateOne(
      { user: agent._id },
      { $inc: { balance: commission }, $set: { lastTransactionAt: new Date() } },
      { session },
    );

    const referenceId = getTransactionId();

    await Transaction.create(
      [
        {
          sender: agent._id,
          receiver: user._id,
          amount,
          fee,
          type: TransactionType.CASH_IN,
          entry: TransactionEntry.DEBIT,
          referenceId,
          status: TransactionStatus.SUCCESS,
          transactionId: `${referenceId}_D`,
          processedAt: new Date(),
        },
        {
          sender: agent._id,
          receiver: user._id,
          amount,
          fee: 0,
          type: TransactionType.CASH_IN,
          entry: TransactionEntry.CREDIT,
          referenceId,
          status: TransactionStatus.SUCCESS,
          transactionId: `${referenceId}_C`,
          processedAt: new Date(),
        },
      ],
      { session,ordered: true },
    );

    await session.commitTransaction();
    session.endSession();
    return { success: true, message: "Cash-in successful", referenceId };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// const cashOut = async (
//   payload: { agent?: string; amount?: number },
//   userId: string,
// ) => {
//   const session = await Transaction.startSession();
//   session.startTransaction();
//   try {
//     const amount = Number(payload.amount || 0);
//     if (!amount || amount < 1) {
//       throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
//     }
//     if (!payload.agent) {
//       throw new AppError(httpStatus.BAD_REQUEST, "Agent is required");
//     }

//     const user = await User.findById(userId).select("_id");
//     const agent = await User.findById(payload.agent).select("_id");
//     if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
//     if (!agent) throw new AppError(httpStatus.NOT_FOUND, "Agent not found");

//     const fee = calculateFee(amount);
//     const commission = fee; // agent commission
//     const totalDebit = amount + fee;

//     const debitRes = await Wallet.updateOne(
//       { user: user._id, balance: { $gte: totalDebit } },
//       { $inc: { balance: -totalDebit }, $set: { lastTransactionAt: new Date() } },
//       { session },
//     );
//     if (debitRes.matchedCount === 0) {
//       throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
//     }

//     // Credit agent with amount + commission (fee goes to agent as commission)
//     const creditRes = await Wallet.updateOne(
//       { user: agent._id },
//       { $inc: { balance: amount + commission }, $set: { lastTransactionAt: new Date() } },
//       { session },
//     );
//     if (creditRes.matchedCount === 0) {
//       throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
//     }

//     // NOTE: For CASH_OUT, fee is treated as agent commission (not admin fee).

//     const referenceId = getTransactionId();
//     await Transaction.create(
//       [
//         {
//           sender: user._id,
//           receiver: agent._id,
//           amount,
//           fee,
//           commission,
//           type: TransactionType.CASH_OUT,
//           entry: TransactionEntry.DEBIT,
//           referenceId,
//           status: TransactionStatus.SUCCESS,
//           transactionId: `${referenceId}_D`,
//           processedAt: new Date(),
//         },
//         {
//           sender: user._id,
//           receiver: agent._id,
//           amount,
//           fee: 0,
//           commission,
//           type: TransactionType.CASH_OUT,
//           entry: TransactionEntry.CREDIT,
//           referenceId,
//           status: TransactionStatus.SUCCESS,
//           transactionId: `${referenceId}_C`,
//           processedAt: new Date(),
//         },
//       ],
//       { session ,ordered: true},
//     );

//     await session.commitTransaction();
//     session.endSession();
//     return { success: true, message: "Cash-out successful", referenceId };
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };


const cashOut = async (payload: { agent?: string; amount?: number }, userId: string) => {
  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    const amount = Number(payload.amount || 0);
    if (!amount || amount < 1) throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
    if (!payload.agent) throw new AppError(httpStatus.BAD_REQUEST, "Agent is required");

    const user = await User.findById(userId).select("_id");
    const agent = await User.findById(payload.agent).select("_id");
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
    if (!agent) throw new AppError(httpStatus.NOT_FOUND, "Agent not found");

    const fee = calculateFee(amount); // platform fee if any
    const commission = Math.round((amount * AGENT_COMMISSION_PERCENT) / 100);
    const totalDebit = amount + fee;

    // Debit user wallet
    const debitRes = await Wallet.updateOne(
      { user: user._id, balance: { $gte: totalDebit } },
      { $inc: { balance: -totalDebit }, $set: { lastTransactionAt: new Date() } },
      { session },
    );
    if (debitRes.matchedCount === 0) throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");

    // Credit agent wallet with commission
    const creditRes = await Wallet.updateOne(
      { user: agent._id },
      { $inc: { balance: amount + commission }, $set: { lastTransactionAt: new Date() } },
      { session },
    );
    if (creditRes.matchedCount === 0) throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");

    // Save transaction entries
    const referenceId = getTransactionId();
    await Transaction.create(
      [
        {
          sender: user._id,
          receiver: agent._id,
          amount,
          fee,
          commission,
          type: TransactionType.CASH_OUT,
          entry: TransactionEntry.DEBIT,
          referenceId,
          status: TransactionStatus.SUCCESS,
          transactionId: `${referenceId}_D`,
          processedAt: new Date(),
        },
        {
          sender: user._id,
          receiver: agent._id,
          amount,
          fee: 0,
          commission,
          type: TransactionType.CASH_OUT,
          entry: TransactionEntry.CREDIT,
          referenceId,
          status: TransactionStatus.SUCCESS,
          transactionId: `${referenceId}_C`,
          processedAt: new Date(),
        },
      ],
      { session, ordered: true },
    );

    await session.commitTransaction();
    session.endSession();
    return { success: true, message: "Cash-out successful", referenceId };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const withdraw = async (payload: Partial<ITransaction>, userId: string) => {
  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const amount = Number(payload.amount || 0);
    if (!amount || amount < 1) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
    }

    const fee = calculateFee(amount);
    const totalDebit = amount + fee;

    const debitRes = await Wallet.updateOne(
      { user: user._id, balance: { $gte: totalDebit } },
      { $inc: { balance: -totalDebit }, $set: { lastTransactionAt: new Date() } },
      { session },
    );
    if (debitRes.matchedCount === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
    }

    if (fee > 0) {
      const adminWalletId = await getSystemAdminWalletId(session);
      await Wallet.updateOne(
        { _id: adminWalletId },
        { $inc: { balance: fee }, $set: { lastTransactionAt: new Date() } },
        { session },
      );
    }

    const referenceId = getTransactionId();
    await Transaction.create(
      [
        {
          sender: user._id,
          amount,
          fee,
          type: TransactionType.WITHDRAW,
          entry: TransactionEntry.DEBIT,
          referenceId,
          status: TransactionStatus.SUCCESS,
          transactionId: `${referenceId}_D`,
          processedAt: new Date(),
        },
      ],
      { session, ordered: true },
    );

    await session.commitTransaction();
    session.endSession();
    return { success: true, message: "Withdraw successful", referenceId };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const transactionService = {
  addMoney,
  withdraw,
  sendMoney,
  cashIn,
  cashOut,

};
