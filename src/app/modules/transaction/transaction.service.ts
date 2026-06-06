/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import {
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
import { Types } from "mongoose";
import { Role } from "../user/user.interface";
import {
  assertAgentCanOperate,
  assertUserCanTransact,
  assertWalletCanTransact,
  validateUserAndWalletForTransaction,
} from "../../helpers/statusValidation";
import { SettingsService } from "../settings/settings.service";
import { QueryBuilder } from "../../utils/QueryBuilder";

const getTransactionId = () => {
  return `trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

const calculateFee = async (amount: number, type: "transaction" | "cashout" = "transaction") => {
  if (!amount || amount <= 0) return 0;
  const settings = await SettingsService.getSettings();
  return type === "cashout" ? settings.cashOutFee : settings.transactionFee;
};

const addMoney = async (payload: Partial<ITransaction>, userId: string) => {
  const transactionId = getTransactionId();
  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    await validateUserAndWalletForTransaction(userId);

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

    const fee = await calculateFee(payload.amount as number);

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
    await validateUserAndWalletForTransaction(userId);

    const senderUser = await User.findById(userId).select("_id phone isActive isDeleted");
    if (!senderUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (!payload.receiver) {
      throw new AppError(httpStatus.BAD_REQUEST, "Receiver phone is required");
    }

    const receiverUser = await User.findOne({
      phone: payload.receiver as string,
    }).select("_id phone isActive isDeleted");
    if (!receiverUser) {
      throw new AppError(httpStatus.NOT_FOUND, "Receiver not found");
    }

    if (String(senderUser._id) === String(receiverUser._id)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Cannot send money to yourself");
    }

    assertUserCanTransact(receiverUser);

    const receiverWallet = await Wallet.findOne({ user: receiverUser._id }).select("status isDeleted");
    if (!receiverWallet) {
      throw new AppError(httpStatus.NOT_FOUND, "Receiver wallet not found");
    }
    assertWalletCanTransact(receiverWallet, "receive");

    const settings = await SettingsService.getSettings();
    const amount = Number(payload.amount || 0);
    if (!amount || amount < 1) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
    }
    if (amount > settings.sendMoneyLimit) {
      throw new AppError(httpStatus.BAD_REQUEST, `Amount exceeds send limit of ${settings.sendMoneyLimit}`);
    }

    const fee = await calculateFee(amount);
    const totalDebit = amount + fee;

    const senderWallet = await Wallet.findOne({ user: senderUser._id }).session(session);
    if (!senderWallet) {
      throw new AppError(httpStatus.NOT_FOUND, "Sender wallet not found");
    }
    assertWalletCanTransact(senderWallet, "send");

    if (senderWallet.balance - totalDebit < settings.minimumWalletBalance) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Insufficient balance. Minimum wallet balance of ${settings.minimumWalletBalance} must be maintained`,
      );
    }

    const debitRes = await Wallet.updateOne(
      { user: senderUser._id, balance: { $gte: totalDebit + settings.minimumWalletBalance } },
      {
        $inc: { balance: -totalDebit },
        $set: { lastTransactionAt: new Date() },
      },
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
      { session, ordered: true },
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
    const agent = await User.findById(agentId).select("_id role isAgentApproved agentStatus isActive isDeleted");
    if (!agent) throw new AppError(httpStatus.NOT_FOUND, "Agent not found");
    assertUserCanTransact(agent);
    assertAgentCanOperate(agent);

    const agentWallet = await Wallet.findOne({ user: agentId }).select("status isDeleted balance");
    if (!agentWallet) {
      throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
    }
    assertWalletCanTransact(agentWallet, "send");

    const amount = Number(payload.amount || 0);
    if (!amount || amount < 1) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
    }
    if (!payload.receiver) {
      throw new AppError(httpStatus.BAD_REQUEST, "receiver required");
    }

    const user = await User.findById(payload.receiver).select("_id isActive isDeleted");
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
    assertUserCanTransact(user);

    const userWallet = await Wallet.findOne({ user: user._id }).select("status isDeleted");
    if (!userWallet) {
      throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
    }
    assertWalletCanTransact(userWallet, "receive");

    const settings = await SettingsService.getSettings();
    const commission = Math.round((amount * settings.agentCommissionPercent) / 100);
    const debitRes = await Wallet.updateOne(
      { user: agent._id, balance: { $gte: amount } },
      {
        $inc: { balance: -amount },
        $set: { lastTransactionAt: new Date() },
      },
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
      {
        $inc: { balance: commission },
        $set: { lastTransactionAt: new Date() },
      },
      { session },
    );

    const referenceId = getTransactionId();

    await Transaction.create(
      [
        {
          sender: agent._id,
          receiver: user.phone,
          amount,
          fee: 0,
          commission,
          type: TransactionType.CASH_IN,
          entry: TransactionEntry.DEBIT,
          referenceId,
          status: TransactionStatus.SUCCESS,
          transactionId: `${referenceId}_D`,
          processedAt: new Date(),
        },
        {
          sender: agent._id,
          receiver: user.phone,
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
      { session, ordered: true },
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

// const cashOut = async (payload: { agent?: string; amount?: number }, userId: string) => {
//   const session = await Transaction.startSession();
//   session.startTransaction();

//   try {
//     const amount = Number(payload.amount || 0);
//     if (!amount || amount < 1) throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
//     if (!payload.agent) throw new AppError(httpStatus.BAD_REQUEST, "Agent is required");

//     const user = await User.findById(userId).select("_id");
//     const agent = await User.findById(payload.agent).select("_id");
//     if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
//     if (!agent) throw new AppError(httpStatus.NOT_FOUND, "Agent not found");

//     const fee = calculateFee(amount); // platform fee if any
//     const commission = Math.round((amount * AGENT_COMMISSION_PERCENT) / 100);
//     const totalDebit = amount + fee;

//     // Debit user wallet
//     const debitRes = await Wallet.updateOne(
//       { user: user._id, balance: { $gte: totalDebit } },
//       { $inc: { balance: -totalDebit }, $set: { lastTransactionAt: new Date() } },
//       { session },
//     );
//     if (debitRes.matchedCount === 0) throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");

//     // Credit agent wallet with commission
//     const creditRes = await Wallet.updateOne(
//       { user: agent._id },
//       { $inc: { balance: amount + commission }, $set: { lastTransactionAt: new Date() } },
//       { session },
//     );
//     if (creditRes.matchedCount === 0) throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");

//     // Save transaction entries
//     const referenceId = getTransactionId();
//     await Transaction.create(
//       [
//         {
//           sender: user._id,
//           receiver: agent.phone,
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
//           receiver: agent.phone,
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
//       { session, ordered: true },
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

const cashOut = async (
  payload: { agent?: string; amount?: number },
  userId: string,
) => {
  const session = await Transaction.startSession();

  session.startTransaction();

  try {
    // amount validation
    const amount = Number(payload.amount || 0);

    if (!amount || amount < 1) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
    }

    // agent validation
    if (!payload.agent) {
      throw new AppError(httpStatus.BAD_REQUEST, "Agent is required");
    }

    // find user
    await validateUserAndWalletForTransaction(userId);
    const user = await User.findById(userId).select("_id");

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    let agent;

    if (Types.ObjectId.isValid(payload.agent)) {
      agent = await User.findById(payload.agent).select("_id phone role isAgentApproved agentStatus isActive isDeleted");
    } else {
      agent = await User.findOne({
        phone: payload.agent,
      }).select("_id phone role isAgentApproved agentStatus isActive isDeleted");
    }

    if (!agent) {
      throw new AppError(httpStatus.NOT_FOUND, "Agent not found");
    }

    if (String(user._id) === String(agent._id)) {
      throw new AppError(httpStatus.BAD_REQUEST, "You cannot cash out to yourself");
    }

    // optional role check
    if (agent.role !== Role.AGENT) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Selected user is not an agent",
      );
    }

    assertAgentCanOperate(agent);
    assertUserCanTransact(agent);

    const agentWallet = await Wallet.findOne({ user: agent._id }).select("status isDeleted");
    if (agentWallet) {
      assertWalletCanTransact(agentWallet, "receive");
    }

    const settings = await SettingsService.getSettings();

    // fee + commission
    const fee = await calculateFee(amount, "cashout");

    const commission = Math.round((amount * settings.agentCommissionPercent) / 100);

    const totalDebit = amount + fee;

    // debit user wallet
    const debitRes = await Wallet.updateOne(
      {
        user: user._id,
        balance: { $gte: totalDebit },
      },
      {
        $inc: {
          balance: -totalDebit,
        },
        $set: {
          lastTransactionAt: new Date(),
        },
      },
      { session },
    );

    if (debitRes.matchedCount === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
    }

    // credit agent wallet
    const creditRes = await Wallet.updateOne(
      {
        user: agent._id,
      },
      {
        $inc: {
          balance: amount + commission,
        },
        $set: {
          lastTransactionAt: new Date(),
        },
      },
      { session },
    );

    if (creditRes.matchedCount === 0) {
      throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
    }

    // add fee to admin wallet
    if (fee > 0) {
      const adminWalletId = await getSystemAdminWalletId(session);

      await Wallet.updateOne(
        {
          _id: adminWalletId,
        },
        {
          $inc: {
            balance: fee,
          },
          $set: {
            lastTransactionAt: new Date(),
          },
        },
        { session },
      );
    }

    // transaction reference
    const referenceId = getTransactionId();

    // save transactions
    await Transaction.create(
      [
        // debit entry
        {
          sender: user._id,

          // STORE AGENT OBJECT ID
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

        // credit entry
        {
          sender: user._id,

          // STORE AGENT OBJECT ID
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
      {
        session,
        ordered: true,
      },
    );

    await session.commitTransaction();

    session.endSession();

    return {
      success: true,
      message: "Cash-out successful",
      referenceId,
    };
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
    await validateUserAndWalletForTransaction(userId);

    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const settings = await SettingsService.getSettings();
    const amount = Number(payload.amount || 0);
    if (!amount || amount < 1) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
    }
    if (amount > settings.withdrawLimit) {
      throw new AppError(httpStatus.BAD_REQUEST, `Amount exceeds withdraw limit of ${settings.withdrawLimit}`);
    }

    const fee = await calculateFee(amount);
    const totalDebit = amount + fee;

    const debitRes = await Wallet.updateOne(
      { user: user._id, balance: { $gte: totalDebit } },
      {
        $inc: { balance: -totalDebit },
        $set: { lastTransactionAt: new Date() },
      },
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


const getMyTransactions = async (userId: string, query: Record<string, string> = {}) => {
  const filter = {
    $or: [{ sender: userId }, { receiver: userId }],
  };

  const queryBuilder = new QueryBuilder(
    Transaction.find(filter)
      .populate("sender", "name email phone")
      .populate("receiver", "name email phone"),
    query,
  );

  const transactions = queryBuilder
    .filter()
    .dateRange()
    .amountRange()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    transactions.build(),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
};

const searchTransactions = async (query: Record<string, string>) => {
  const filter: Record<string, unknown> = {};

  if (query.user) {
    filter.$or = [{ sender: query.user }, { receiver: query.user }];
  }
  if (query.type) {
    filter.type = query.type;
  }
  if (query.status) {
    filter.status = query.status;
  }

  const queryBuilder = new QueryBuilder(
    Transaction.find(filter)
      .populate("sender", "name email phone")
      .populate("receiver", "name email phone"),
    query,
  );

  const transactions = queryBuilder
    .search(["transactionId", "referenceId"])
    .dateRange()
    .amountRange()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    transactions.build(),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
};

const processGatewayCallback = async (args: {
  transactionId?: string;
  status: "success" | "fail" | "cancel";
}) => {
  if (!args.transactionId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid transaction reference");
  }

  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    const trx = await Transaction.findOne({ transactionId: args.transactionId }).session(session);
    if (!trx) {
      throw new AppError(httpStatus.NOT_FOUND, "Transaction not found");
    }

    if (trx.status !== TransactionStatus.PENDING) {
      await session.commitTransaction();
      session.endSession();
      return {
        success: trx.status === TransactionStatus.SUCCESS,
        message: "Callback already processed",
      };
    }

    if (args.status === "success") {
      const updated = await Transaction.findOneAndUpdate(
        { transactionId: args.transactionId, status: TransactionStatus.PENDING },
        { status: TransactionStatus.SUCCESS, processedAt: new Date() },
        { new: true, runValidators: true, session },
      );

      if (!updated) {
        await session.commitTransaction();
        session.endSession();
        return { success: true, message: "Callback already processed" };
      }

      if (updated.type !== TransactionType.ADD) {
        throw new AppError(httpStatus.BAD_REQUEST, "Unsupported payment transaction type");
      }

      const walletRes = await Wallet.updateOne(
        { user: updated.sender },
        { $inc: { balance: updated.amount }, $set: { lastTransactionAt: new Date() } },
        { session },
      );
      if (walletRes.matchedCount === 0) {
        throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
      }

      const fee = updated.fee || 0;
      if (fee > 0) {
        const adminWalletId = await getSystemAdminWalletId(session);
        await Wallet.updateOne(
          { _id: adminWalletId },
          { $inc: { balance: fee }, $set: { lastTransactionAt: new Date() } },
          { session },
        );
      }

      await session.commitTransaction();
      session.endSession();
      return { success: true, message: "Transaction Completed Successfully" };
    }

    const nextStatus =
      args.status === "fail" ? TransactionStatus.FAILED : TransactionStatus.REVERSED;

    await Transaction.findOneAndUpdate(
      { transactionId: args.transactionId, status: TransactionStatus.PENDING },
      { status: nextStatus, processedAt: new Date() },
      { new: true, runValidators: true, session },
    );

    await session.commitTransaction();
    session.endSession();
    return {
      success: false,
      message: args.status === "fail" ? "Payment Failed" : "Payment Cancelled",
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const successPayment = (query: Record<string, string>) =>
  processGatewayCallback({
    transactionId: query.transactionId || query.tran_id || query.tranId,
    status: "success",
  });

const failPayment = (query: Record<string, string>) =>
  processGatewayCallback({
    transactionId: query.transactionId || query.tran_id || query.tranId,
    status: "fail",
  });

const cancelPayment = (query: Record<string, string>) =>
  processGatewayCallback({
    transactionId: query.transactionId || query.tran_id || query.tranId,
    status: "cancel",
  });

export const transactionService = {
  addMoney,
  withdraw,
  sendMoney,
  cashIn,
  cashOut,
  getMyTransactions,
  searchTransactions,
  successPayment,
  failPayment,
  cancelPayment,
};
