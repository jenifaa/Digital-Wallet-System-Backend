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
const mongoose_1 = require("mongoose");
const user_interface_1 = require("../user/user.interface");
const statusValidation_1 = require("../../helpers/statusValidation");
const settings_service_1 = require("../settings/settings.service");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const getTransactionId = () => {
    return `trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};
const calculateFee = (amount_1, ...args_1) => __awaiter(void 0, [amount_1, ...args_1], void 0, function* (amount, type = "transaction") {
    if (!amount || amount <= 0)
        return 0;
    const settings = yield settings_service_1.SettingsService.getSettings();
    return type === "cashout" ? settings.cashOutFee : settings.transactionFee;
});
const addMoney = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const transactionId = getTransactionId();
    const session = yield transaction_model_1.Transaction.startSession();
    session.startTransaction();
    try {
        yield (0, statusValidation_1.validateUserAndWalletForTransaction)(userId);
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        }
        if (!user.phone) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Please update your profile first");
        }
        const fee = yield calculateFee(payload.amount);
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
        yield (0, statusValidation_1.validateUserAndWalletForTransaction)(userId);
        const senderUser = yield user_model_1.User.findById(userId).select("_id phone isActive isDeleted");
        if (!senderUser) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        }
        if (!payload.receiver) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Receiver phone is required");
        }
        const receiverUser = yield user_model_1.User.findOne({
            phone: payload.receiver,
        }).select("_id phone isActive isDeleted");
        if (!receiverUser) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Receiver not found");
        }
        if (String(senderUser._id) === String(receiverUser._id)) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cannot send money to yourself");
        }
        (0, statusValidation_1.assertUserCanTransact)(receiverUser);
        const receiverWallet = yield wallet_model_1.Wallet.findOne({ user: receiverUser._id }).select("status isDeleted");
        if (!receiverWallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Receiver wallet not found");
        }
        (0, statusValidation_1.assertWalletCanTransact)(receiverWallet, "receive");
        const settings = yield settings_service_1.SettingsService.getSettings();
        const amount = Number(payload.amount || 0);
        if (!amount || amount < 1) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid amount");
        }
        if (amount > settings.sendMoneyLimit) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Amount exceeds send limit of ${settings.sendMoneyLimit}`);
        }
        const fee = yield calculateFee(amount);
        const totalDebit = amount + fee;
        const senderWallet = yield wallet_model_1.Wallet.findOne({ user: senderUser._id }).session(session);
        if (!senderWallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Sender wallet not found");
        }
        (0, statusValidation_1.assertWalletCanTransact)(senderWallet, "send");
        if (senderWallet.balance - totalDebit < settings.minimumWalletBalance) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Insufficient balance. Minimum wallet balance of ${settings.minimumWalletBalance} must be maintained`);
        }
        const debitRes = yield wallet_model_1.Wallet.updateOne({ user: senderUser._id, balance: { $gte: totalDebit + settings.minimumWalletBalance } }, {
            $inc: { balance: -totalDebit },
            $set: { lastTransactionAt: new Date() },
        }, { session });
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
        const agent = yield user_model_1.User.findById(agentId).select("_id role isAgentApproved agentStatus isActive isDeleted");
        if (!agent)
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent not found");
        (0, statusValidation_1.assertUserCanTransact)(agent);
        (0, statusValidation_1.assertAgentCanOperate)(agent);
        const agentWallet = yield wallet_model_1.Wallet.findOne({ user: agentId }).select("status isDeleted balance");
        if (!agentWallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent wallet not found");
        }
        (0, statusValidation_1.assertWalletCanTransact)(agentWallet, "send");
        const amount = Number(payload.amount || 0);
        if (!amount || amount < 1) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid amount");
        }
        if (!payload.receiver) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "receiver required");
        }
        const user = yield user_model_1.User.findById(payload.receiver).select("_id isActive isDeleted");
        if (!user)
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        (0, statusValidation_1.assertUserCanTransact)(user);
        const userWallet = yield wallet_model_1.Wallet.findOne({ user: user._id }).select("status isDeleted");
        if (!userWallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User wallet not found");
        }
        (0, statusValidation_1.assertWalletCanTransact)(userWallet, "receive");
        const settings = yield settings_service_1.SettingsService.getSettings();
        const commission = Math.round((amount * settings.agentCommissionPercent) / 100);
        const debitRes = yield wallet_model_1.Wallet.updateOne({ user: agent._id, balance: { $gte: amount } }, {
            $inc: { balance: -amount },
            $set: { lastTransactionAt: new Date() },
        }, { session });
        if (debitRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient agent balance");
        }
        const creditRes = yield wallet_model_1.Wallet.updateOne({ user: user._id }, { $inc: { balance: amount }, $set: { lastTransactionAt: new Date() } }, { session });
        if (creditRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User wallet not found");
        }
        yield wallet_model_1.Wallet.updateOne({ user: agent._id }, {
            $inc: { balance: commission },
            $set: { lastTransactionAt: new Date() },
        }, { session });
        const referenceId = getTransactionId();
        yield transaction_model_1.Transaction.create([
            {
                sender: agent._id,
                receiver: user.phone,
                amount,
                fee: 0,
                commission,
                type: transaction_interface_1.TransactionType.CASH_IN,
                entry: transaction_interface_1.TransactionEntry.DEBIT,
                referenceId,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${referenceId}_D`,
                processedAt: new Date(),
            },
            {
                sender: agent._id,
                receiver: user.phone,
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
const cashOut = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield transaction_model_1.Transaction.startSession();
    session.startTransaction();
    try {
        // amount validation
        const amount = Number(payload.amount || 0);
        if (!amount || amount < 1) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid amount");
        }
        // agent validation
        if (!payload.agent) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Agent is required");
        }
        // find user
        yield (0, statusValidation_1.validateUserAndWalletForTransaction)(userId);
        const user = yield user_model_1.User.findById(userId).select("_id");
        if (!user) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        }
        let agent;
        if (mongoose_1.Types.ObjectId.isValid(payload.agent)) {
            agent = yield user_model_1.User.findById(payload.agent).select("_id phone role isAgentApproved agentStatus isActive isDeleted");
        }
        else {
            agent = yield user_model_1.User.findOne({
                phone: payload.agent,
            }).select("_id phone role isAgentApproved agentStatus isActive isDeleted");
        }
        if (!agent) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent not found");
        }
        if (String(user._id) === String(agent._id)) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cannot cash out to yourself");
        }
        // optional role check
        if (agent.role !== user_interface_1.Role.AGENT) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Selected user is not an agent");
        }
        (0, statusValidation_1.assertAgentCanOperate)(agent);
        (0, statusValidation_1.assertUserCanTransact)(agent);
        const agentWallet = yield wallet_model_1.Wallet.findOne({ user: agent._id }).select("status isDeleted");
        if (agentWallet) {
            (0, statusValidation_1.assertWalletCanTransact)(agentWallet, "receive");
        }
        const settings = yield settings_service_1.SettingsService.getSettings();
        // fee + commission
        const fee = yield calculateFee(amount, "cashout");
        const commission = Math.round((amount * settings.agentCommissionPercent) / 100);
        const totalDebit = amount + fee;
        // debit user wallet
        const debitRes = yield wallet_model_1.Wallet.updateOne({
            user: user._id,
            balance: { $gte: totalDebit },
        }, {
            $inc: {
                balance: -totalDebit,
            },
            $set: {
                lastTransactionAt: new Date(),
            },
        }, { session });
        if (debitRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance");
        }
        // credit agent wallet
        const creditRes = yield wallet_model_1.Wallet.updateOne({
            user: agent._id,
        }, {
            $inc: {
                balance: amount + commission,
            },
            $set: {
                lastTransactionAt: new Date(),
            },
        }, { session });
        if (creditRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent wallet not found");
        }
        // add fee to admin wallet
        if (fee > 0) {
            const adminWalletId = yield getSystemAdminWalletId(session);
            yield wallet_model_1.Wallet.updateOne({
                _id: adminWalletId,
            }, {
                $inc: {
                    balance: fee,
                },
                $set: {
                    lastTransactionAt: new Date(),
                },
            }, { session });
        }
        // transaction reference
        const referenceId = getTransactionId();
        // save transactions
        yield transaction_model_1.Transaction.create([
            // debit entry
            {
                sender: user._id,
                // STORE AGENT OBJECT ID
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
            // credit entry
            {
                sender: user._id,
                // STORE AGENT OBJECT ID
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
        ], {
            session,
            ordered: true,
        });
        yield session.commitTransaction();
        session.endSession();
        return {
            success: true,
            message: "Cash-out successful",
            referenceId,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const withdraw = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield transaction_model_1.Transaction.startSession();
    session.startTransaction();
    try {
        yield (0, statusValidation_1.validateUserAndWalletForTransaction)(userId);
        const user = yield user_model_1.User.findById(userId).select("_id");
        if (!user) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        }
        const settings = yield settings_service_1.SettingsService.getSettings();
        const amount = Number(payload.amount || 0);
        if (!amount || amount < 1) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid amount");
        }
        if (amount > settings.withdrawLimit) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Amount exceeds withdraw limit of ${settings.withdrawLimit}`);
        }
        const fee = yield calculateFee(amount);
        const totalDebit = amount + fee;
        const debitRes = yield wallet_model_1.Wallet.updateOne({ user: user._id, balance: { $gte: totalDebit } }, {
            $inc: { balance: -totalDebit },
            $set: { lastTransactionAt: new Date() },
        }, { session });
        if (debitRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance");
        }
        if (fee > 0) {
            const adminWalletId = yield getSystemAdminWalletId(session);
            yield wallet_model_1.Wallet.updateOne({ _id: adminWalletId }, { $inc: { balance: fee }, $set: { lastTransactionAt: new Date() } }, { session });
        }
        const referenceId = getTransactionId();
        yield transaction_model_1.Transaction.create([
            {
                sender: user._id,
                amount,
                fee,
                type: transaction_interface_1.TransactionType.WITHDRAW,
                entry: transaction_interface_1.TransactionEntry.DEBIT,
                referenceId,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${referenceId}_D`,
                processedAt: new Date(),
            },
        ], { session, ordered: true });
        yield session.commitTransaction();
        session.endSession();
        return { success: true, message: "Withdraw successful", referenceId };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const getMyTransactions = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, query = {}) {
    const filter = {
        $or: [{ sender: userId }, { receiver: userId }],
    };
    const queryBuilder = new QueryBuilder_1.QueryBuilder(transaction_model_1.Transaction.find(filter)
        .populate("sender", "name email phone")
        .populate("receiver", "name email phone"), query);
    const transactions = queryBuilder
        .filter()
        .dateRange()
        .amountRange()
        .sort()
        .paginate();
    const [data, meta] = yield Promise.all([
        transactions.build(),
        queryBuilder.getMeta(),
    ]);
    return { data, meta };
});
const searchTransactions = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    if (query.user) {
        filter.$or = [{ sender: query.user }, { receiver: query.user }];
    }
    if (query.type) {
        filter.type = query.type;
    }
    if (query.status) {
        filter.status = query.status;
    }
    const queryBuilder = new QueryBuilder_1.QueryBuilder(transaction_model_1.Transaction.find(filter)
        .populate("sender", "name email phone")
        .populate("receiver", "name email phone"), query);
    const transactions = queryBuilder
        .search(["transactionId", "referenceId"])
        .dateRange()
        .amountRange()
        .sort()
        .paginate();
    const [data, meta] = yield Promise.all([
        transactions.build(),
        queryBuilder.getMeta(),
    ]);
    return { data, meta };
});
const processGatewayCallback = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (!args.transactionId) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid transaction reference");
    }
    const session = yield transaction_model_1.Transaction.startSession();
    session.startTransaction();
    try {
        const trx = yield transaction_model_1.Transaction.findOne({ transactionId: args.transactionId }).session(session);
        if (!trx) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Transaction not found");
        }
        if (trx.status !== transaction_interface_1.TransactionStatus.PENDING) {
            yield session.commitTransaction();
            session.endSession();
            return {
                success: trx.status === transaction_interface_1.TransactionStatus.SUCCESS,
                message: "Callback already processed",
            };
        }
        if (args.status === "success") {
            const updated = yield transaction_model_1.Transaction.findOneAndUpdate({ transactionId: args.transactionId, status: transaction_interface_1.TransactionStatus.PENDING }, { status: transaction_interface_1.TransactionStatus.SUCCESS, processedAt: new Date() }, { new: true, runValidators: true, session });
            if (!updated) {
                yield session.commitTransaction();
                session.endSession();
                return { success: true, message: "Callback already processed" };
            }
            if (updated.type !== transaction_interface_1.TransactionType.ADD) {
                throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Unsupported payment transaction type");
            }
            const walletRes = yield wallet_model_1.Wallet.updateOne({ user: updated.sender }, { $inc: { balance: updated.amount }, $set: { lastTransactionAt: new Date() } }, { session });
            if (walletRes.matchedCount === 0) {
                throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User wallet not found");
            }
            const fee = updated.fee || 0;
            if (fee > 0) {
                const adminWalletId = yield getSystemAdminWalletId(session);
                yield wallet_model_1.Wallet.updateOne({ _id: adminWalletId }, { $inc: { balance: fee }, $set: { lastTransactionAt: new Date() } }, { session });
            }
            yield session.commitTransaction();
            session.endSession();
            return { success: true, message: "Transaction Completed Successfully" };
        }
        const nextStatus = args.status === "fail" ? transaction_interface_1.TransactionStatus.FAILED : transaction_interface_1.TransactionStatus.REVERSED;
        yield transaction_model_1.Transaction.findOneAndUpdate({ transactionId: args.transactionId, status: transaction_interface_1.TransactionStatus.PENDING }, { status: nextStatus, processedAt: new Date() }, { new: true, runValidators: true, session });
        yield session.commitTransaction();
        session.endSession();
        return {
            success: false,
            message: args.status === "fail" ? "Payment Failed" : "Payment Cancelled",
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const successPayment = (query) => processGatewayCallback({
    transactionId: query.transactionId || query.tran_id || query.tranId,
    status: "success",
});
const failPayment = (query) => processGatewayCallback({
    transactionId: query.transactionId || query.tran_id || query.tranId,
    status: "fail",
});
const cancelPayment = (query) => processGatewayCallback({
    transactionId: query.transactionId || query.tran_id || query.tranId,
    status: "cancel",
});
exports.transactionService = {
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
