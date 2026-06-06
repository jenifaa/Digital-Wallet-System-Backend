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
exports.LoanService = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const statusValidation_1 = require("../../helpers/statusValidation");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const user_model_1 = require("../user/user.model");
const wallet_model_1 = require("../wallet/wallet.model");
const settings_service_1 = require("../settings/settings.service");
const loan_interface_1 = require("./loan.interface");
const loan_model_1 = require("./loan.model");
const mongoose_1 = require("mongoose");
const transaction_model_1 = require("../transaction/transaction.model");
const transaction_interface_1 = require("../transaction/transaction.interface");
const generateLoanReference = () => `loan_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
const requestLoan = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    (0, statusValidation_1.assertUserCanTransact)(user);
    const settings = yield settings_service_1.SettingsService.getSettings();
    if (amount < 1) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid loan amount");
    }
    if (amount > settings.loanLimit) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Loan amount exceeds limit of ${settings.loanLimit}`);
    }
    const pendingLoan = yield loan_model_1.Loan.findOne({
        user: userId,
        status: { $in: [loan_interface_1.LoanStatus.PENDING, loan_interface_1.LoanStatus.APPROVED] },
    });
    if (pendingLoan) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You already have an active or pending loan");
    }
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 3);
    const loan = yield loan_model_1.Loan.create({
        user: userId,
        amount,
        status: loan_interface_1.LoanStatus.PENDING,
        referenceId: generateLoanReference(),
        dueDate,
    });
    return loan;
});
const getMyLoans = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(loan_model_1.Loan.find({ user: userId }).populate("approvedBy rejectedBy", "name email"), query);
    const loans = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([loans.build(), queryBuilder.getMeta()]);
    return { data, meta };
});
const getAllLoans = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(loan_model_1.Loan.find().populate("user", "name email phone").populate("approvedBy rejectedBy", "name email"), query);
    const loans = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([loans.build(), queryBuilder.getMeta()]);
    return { data, meta };
});
const approveLoan = (loanId, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield loan_model_1.Loan.startSession();
    session.startTransaction();
    try {
        const loan = yield loan_model_1.Loan.findById(loanId).session(session);
        if (!loan) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Loan not found");
        }
        if (loan.status !== loan_interface_1.LoanStatus.PENDING) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Only pending loans can be approved");
        }
        const user = yield user_model_1.User.findById(loan.user).session(session);
        if (!user) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        }
        (0, statusValidation_1.assertUserCanTransact)(user);
        const walletRes = yield wallet_model_1.Wallet.updateOne({ user: loan.user }, { $inc: { balance: loan.amount }, $set: { lastTransactionAt: new Date() } }, { session });
        if (walletRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User wallet not found");
        }
        loan.status = loan_interface_1.LoanStatus.APPROVED;
        loan.approvedBy = new mongoose_1.Types.ObjectId(adminId);
        yield loan.save({ session });
        yield transaction_model_1.Transaction.create([
            {
                sender: loan.user,
                amount: loan.amount,
                fee: 0,
                type: transaction_interface_1.TransactionType.ADD,
                entry: transaction_interface_1.TransactionEntry.CREDIT,
                referenceId: loan.referenceId,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${loan.referenceId}_LOAN`,
                processedAt: new Date(),
            },
        ], { session });
        yield session.commitTransaction();
        session.endSession();
        return loan;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const rejectLoan = (loanId, adminId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const loan = yield loan_model_1.Loan.findById(loanId);
    if (!loan) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Loan not found");
    }
    if (loan.status !== loan_interface_1.LoanStatus.PENDING) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Only pending loans can be rejected");
    }
    loan.status = loan_interface_1.LoanStatus.REJECTED;
    loan.rejectedBy = new mongoose_1.Types.ObjectId(adminId);
    loan.rejectionReason = reason;
    yield loan.save();
    return loan;
});
const repayLoan = (userId, loanId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield loan_model_1.Loan.startSession();
    session.startTransaction();
    try {
        const loan = yield loan_model_1.Loan.findOne({ _id: loanId, user: userId }).session(session);
        if (!loan) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Loan not found");
        }
        if (loan.status !== loan_interface_1.LoanStatus.APPROVED) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Only approved loans can be repaid");
        }
        const repayAmount = amount !== null && amount !== void 0 ? amount : loan.amount - (loan.repaidAmount || 0);
        if (repayAmount <= 0) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid repayment amount");
        }
        const debitRes = yield wallet_model_1.Wallet.updateOne({ user: userId, balance: { $gte: repayAmount } }, { $inc: { balance: -repayAmount }, $set: { lastTransactionAt: new Date() } }, { session });
        if (debitRes.matchedCount === 0) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance for repayment");
        }
        loan.repaidAmount = (loan.repaidAmount || 0) + repayAmount;
        if (loan.repaidAmount >= loan.amount) {
            loan.status = loan_interface_1.LoanStatus.REPAID;
            loan.repaidAt = new Date();
        }
        yield loan.save({ session });
        yield transaction_model_1.Transaction.create([
            {
                sender: userId,
                amount: repayAmount,
                fee: 0,
                type: transaction_interface_1.TransactionType.WITHDRAW,
                entry: transaction_interface_1.TransactionEntry.DEBIT,
                referenceId: `${loan.referenceId}_REPAY`,
                status: transaction_interface_1.TransactionStatus.SUCCESS,
                transactionId: `${loan.referenceId}_REPAY_${Date.now()}`,
                processedAt: new Date(),
            },
        ], { session });
        yield session.commitTransaction();
        session.endSession();
        return loan;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
exports.LoanService = {
    requestLoan,
    getMyLoans,
    getAllLoans,
    approveLoan,
    rejectLoan,
    repayLoan,
};
