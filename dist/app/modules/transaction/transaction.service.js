"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const transaction_interface_1 = require("./transaction.interface");
const transaction_model_1 = require("./transaction.model");
const sslCommerz_service_1 = require("../sslCommerz/sslCommerz.service");
const wallet_model_1 = require("../wallet/wallet.model");
const env_1 = require("../../config/env");
const getTransactionId = () => {
    return `trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};
const calculateFee = (amount) => {
    if (!amount || amount <= 0)
        return 0;
    // Project requirement per your latest message: fee should be 5 (even for 350)
    return 5;
};
const addMoney = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const transactionId = getTransactionId();
    const session = yield transaction_model_1.Transaction.startSession();
    session.startTransaction();
    try {
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        }
        if (!user.phone) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Please update your profile first");
        }
        const fee = calculateFee(payload.amount);
        const totalPayable = payload.amount + fee;
        const transaction = yield transaction_model_1.Transaction.create([
            {
                sender: user._id,
                amount: payload.amount,
                fee,
                type: transaction_interface_1.TransactionType.ADD,
                status: transaction_interface_1.TransactionStatus.PENDING,
                transactionId: transactionId,
            },
        ], { session });
        const sslPayload = {
            amount: totalPayable,
            transactionId: transactionId,
            name: user.name,
            email: user.email,
            phone: user.phone,
        };
        const sslResponse = yield sslCommerz_service_1.SSLService.sslPaymentInit(sslPayload);
        if (sslResponse.status !== "SUCCESS") {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, sslResponse.failedreason || "SSL payment initialization failed");
        }
        yield session.commitTransaction();
        session.endSession();
        return {
            message: "Redirect to payment gateway",
            paymentUrl: sslResponse.GatewayPageURL,
            transactionId,
        };
    }
    catch (error) {
        yield session.abortTransaction(); // rollback
        session.endSession();
        throw error;
    }
});
const getSystemAdminWalletId = (session) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield user_model_1.User.findOne({ email: env_1.envVars.SUPER_ADMIN_EMAIL })
        .select("_id wallet")
        .session(session);
    if (!admin) {
        throw new AppError_1.default(http_status_codes_1.default.INTERNAL_SERVER_ERROR, "System admin not found");
    }
    if (!admin.wallet) {
        const wallet = yield wallet_model_1.Wallet.create([{ user: admin._id }], { session });
        admin.wallet = wallet[0]._id;
        yield admin.save({ session });
    }
    return admin.wallet;
});
const sendMoney = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield transaction_model_1.Transaction.startSession();
    session.startTransaction();
    try {
        const senderUser = yield user_model_1.User.findById(userId).select("_id");
        if (!senderUser) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        }
        if (!payload.receiver) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Receiver is required");
        }
        const receiverUser = yield user_model_1.User.findById(payload.receiver).select("_id");
        if (!receiverUser) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Receiver not found");
        }
        const amount = Number(payload.amount || 0);
        if (!amount || amount < 1) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid amount");
        }
        const fee = calculateFee(amount);
        const totalDebit = amount + fee;
        const debitRes = yield wallet_model_1.Wallet.updateOne({ user: senderUser._id, balance: { $gte: totalDebit } }, { $inc: { balance: -totalDebit }, $set: { lastTransactionAt: new Date() } }, { session });
        if (debitRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance");
        }
        const creditRes = yield wallet_model_1.Wallet.updateOne({ user: receiverUser._id }, { $inc: { balance: amount }, $set: { lastTransactionAt: new Date() } }, { session });
        if (creditRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Receiver wallet not found");
        }
        if (fee > 0) {
            const adminWalletId = yield getSystemAdminWalletId(session);
            yield wallet_model_1.Wallet.updateOne({ _id: adminWalletId }, { $inc: { balance: fee }, $set: { lastTransactionAt: new Date() } }, { session });
        }
        const referenceId = getTransactionId();
        yield transaction_model_1.Transaction.create([
            {
                sender: senderUser._id,
                receiver: receiverUser._id,
                amount,
                fee,
                type: transaction_interface_1.TransactionType.SEND,
                entry: transaction_interface_1.TransactionEntry.DEBIT,
                referenceId,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${referenceId}_D`,
                processedAt: new Date(),
            },
            {
                sender: senderUser._id,
                receiver: receiverUser._id,
                amount,
                fee: 0,
                type: transaction_interface_1.TransactionType.SEND,
                entry: transaction_interface_1.TransactionEntry.CREDIT,
                referenceId,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${referenceId}_C`,
                processedAt: new Date(),
            },
        ], { session, ordered: true });
        yield session.commitTransaction();
        session.endSession();
        return { success: true, message: "Money sent successfully", referenceId };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const cashIn = (payload, agentId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield transaction_model_1.Transaction.startSession();
    session.startTransaction();
    try {
        const amount = Number(payload.amount || 0);
        if (!amount || amount < 1) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid amount");
        }
        if (!payload.receiver) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "receiver required");
        }
        const agent = yield user_model_1.User.findById(agentId).select("_id");
        const user = yield user_model_1.User.findById(payload.receiver).select("_id");
        if (!agent)
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent not found");
        if (!user)
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        const fee = 0;
        const commission = Math.round((amount * transaction_interface_1.AGENT_COMMISSION_PERCENT) / 100);
        const debitRes = yield wallet_model_1.Wallet.updateOne({ user: agent._id, balance: { $gte: amount + fee } }, { $inc: { balance: -(amount + fee) }, $set: { lastTransactionAt: new Date() } }, { session });
        if (debitRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient agent balance");
        }
        const creditRes = yield wallet_model_1.Wallet.updateOne({ user: user._id }, { $inc: { balance: amount }, $set: { lastTransactionAt: new Date() } }, { session });
        if (creditRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User wallet not found");
        }
        yield wallet_model_1.Wallet.updateOne({ user: agent._id }, { $inc: { balance: commission }, $set: { lastTransactionAt: new Date() } }, { session });
        const referenceId = getTransactionId();
        yield transaction_model_1.Transaction.create([
            {
                sender: agent._id,
                receiver: user._id,
                amount,
                fee,
                type: transaction_interface_1.TransactionType.CASH_IN,
                entry: transaction_interface_1.TransactionEntry.DEBIT,
                referenceId,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${referenceId}_D`,
                processedAt: new Date(),
            },
            {
                sender: agent._id,
                receiver: user._id,
                amount,
                fee: 0,
                type: transaction_interface_1.TransactionType.CASH_IN,
                entry: transaction_interface_1.TransactionEntry.CREDIT,
                referenceId,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${referenceId}_C`,
                processedAt: new Date(),
            },
        ], { session, ordered: true });
        yield session.commitTransaction();
        session.endSession();
        return { success: true, message: "Cash-in successful", referenceId };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
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
const cashOut = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield transaction_model_1.Transaction.startSession();
    session.startTransaction();
    try {
        const amount = Number(payload.amount || 0);
        if (!amount || amount < 1)
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid amount");
        if (!payload.agent)
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Agent is required");
        const user = yield user_model_1.User.findById(userId).select("_id");
        const agent = yield user_model_1.User.findById(payload.agent).select("_id");
        if (!user)
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        if (!agent)
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent not found");
        const fee = calculateFee(amount); // platform fee if any
        const commission = Math.round((amount * transaction_interface_1.AGENT_COMMISSION_PERCENT) / 100);
        const totalDebit = amount + fee;
        // Debit user wallet
        const debitRes = yield wallet_model_1.Wallet.updateOne({ user: user._id, balance: { $gte: totalDebit } }, { $inc: { balance: -totalDebit }, $set: { lastTransactionAt: new Date() } }, { session });
        if (debitRes.matchedCount === 0)
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance");
        // Credit agent wallet with commission
        const creditRes = yield wallet_model_1.Wallet.updateOne({ user: agent._id }, { $inc: { balance: amount + commission }, $set: { lastTransactionAt: new Date() } }, { session });
        if (creditRes.matchedCount === 0)
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent wallet not found");
        // Save transaction entries
        const referenceId = getTransactionId();
        yield transaction_model_1.Transaction.create([
            {
                sender: user._id,
                receiver: agent._id,
                amount,
                fee,
                commission,
                type: transaction_interface_1.TransactionType.CASH_OUT,
                entry: transaction_interface_1.TransactionEntry.DEBIT,
                referenceId,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${referenceId}_D`,
                processedAt: new Date(),
            },
            {
                sender: user._id,
                receiver: agent._id,
                amount,
                fee: 0,
                commission,
                type: transaction_interface_1.TransactionType.CASH_OUT,
                entry: transaction_interface_1.TransactionEntry.CREDIT,
                referenceId,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${referenceId}_C`,
                processedAt: new Date(),
            },
        ], { session, ordered: true });
        yield session.commitTransaction();
        session.endSession();
        return { success: true, message: "Cash-out successful", referenceId };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
exports.transactionService = {
    addMoney,
    sendMoney,
    cashIn,
    cashOut,
};
