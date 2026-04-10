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
exports.PaymentService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const transaction_model_1 = require("../transaction/transaction.model");
const transaction_interface_1 = require("../transaction/transaction.interface");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const wallet_model_1 = require("../wallet/wallet.model");
const env_1 = require("../../config/env");
const user_model_1 = require("../user/user.model");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
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
const processGatewayCallback = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (!args.transactionId) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid transaction reference");
    }
    const session = yield transaction_model_1.Transaction.startSession();
    session.startTransaction();
    try {
        const trx = yield transaction_model_1.Transaction.findOne({ transactionId: args.transactionId })
            .session(session)
            .exec();
        if (!trx) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Transaction not found");
        }
        // Idempotency: only process once from PENDING -> final
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
        const nextStatus = args.status === "fail"
            ? transaction_interface_1.TransactionStatus.FAILED
            : transaction_interface_1.TransactionStatus.REVERSED;
        const updated = yield transaction_model_1.Transaction.findOneAndUpdate({ transactionId: args.transactionId, status: transaction_interface_1.TransactionStatus.PENDING }, { status: nextStatus, processedAt: new Date() }, { new: true, runValidators: true, session });
        if (!updated) {
            yield session.commitTransaction();
            session.endSession();
            return { success: false, message: "Callback already processed" };
        }
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
const successPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    return processGatewayCallback({
        transactionId: query.transactionId || query.tran_id || query.tranId,
        status: "success",
    });
});
const failPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    return processGatewayCallback({
        transactionId: query.transactionId || query.tran_id || query.tranId,
        status: "fail",
    });
});
const cancelPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    return processGatewayCallback({
        transactionId: query.transactionId || query.tran_id || query.tranId,
        status: "cancel",
    });
});
exports.PaymentService = {
    // initPayment,
    successPayment,
    failPayment,
    cancelPayment,
};
