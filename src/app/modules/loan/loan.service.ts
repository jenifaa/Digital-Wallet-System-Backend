import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { assertUserCanTransact } from "../../helpers/statusValidation";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { SettingsService } from "../settings/settings.service";
import { ILoan, LoanStatus } from "./loan.interface";
import { Loan } from "./loan.model";
import { Types } from "mongoose";
import { Transaction } from "../transaction/transaction.model";
import {
  TransactionEntry,
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.interface";

const generateLoanReference = () =>
  `loan_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const requestLoan = async (userId: string, amount: number) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  assertUserCanTransact(user);

  const settings = await SettingsService.getSettings();
  if (amount < 1) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid loan amount");
  }
  if (amount > settings.loanLimit) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Loan amount exceeds limit of ${settings.loanLimit}`,
    );
  }

  const pendingLoan = await Loan.findOne({
    user: userId,
    status: { $in: [LoanStatus.PENDING, LoanStatus.APPROVED] },
  });
  if (pendingLoan) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You already have an active or pending loan",
    );
  }

  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + 3);

  const loan = await Loan.create({
    user: userId,
    amount,
    status: LoanStatus.PENDING,
    referenceId: generateLoanReference(),
    dueDate,
  });

  return loan;
};

const getMyLoans = async (userId: string, query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Loan.find({ user: userId }).populate("approvedBy rejectedBy", "name email"),
    query,
  );
  const loans = queryBuilder.filter().sort().paginate();
  const [data, meta] = await Promise.all([loans.build(), queryBuilder.getMeta()]);
  return { data, meta };
};

const getAllLoans = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Loan.find().populate("user", "name email phone").populate("approvedBy rejectedBy", "name email"),
    query,
  );
  const loans = queryBuilder.filter().sort().paginate();
  const [data, meta] = await Promise.all([loans.build(), queryBuilder.getMeta()]);
  return { data, meta };
};

const approveLoan = async (loanId: string, adminId: string) => {
  const session = await Loan.startSession();
  session.startTransaction();

  try {
    const loan = await Loan.findById(loanId).session(session);
    if (!loan) {
      throw new AppError(httpStatus.NOT_FOUND, "Loan not found");
    }
    if (loan.status !== LoanStatus.PENDING) {
      throw new AppError(httpStatus.BAD_REQUEST, "Only pending loans can be approved");
    }

    const user = await User.findById(loan.user).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }
    assertUserCanTransact(user);

    const walletRes = await Wallet.updateOne(
      { user: loan.user },
      { $inc: { balance: loan.amount }, $set: { lastTransactionAt: new Date() } },
      { session },
    );
    if (walletRes.matchedCount === 0) {
      throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
    }

    loan.status = LoanStatus.APPROVED;
    loan.approvedBy = new Types.ObjectId(adminId);
    await loan.save({ session });

    await Transaction.create(
      [
        {
          sender: loan.user,
          amount: loan.amount,
          fee: 0,
          type: TransactionType.ADD,
          entry: TransactionEntry.CREDIT,
          referenceId: loan.referenceId,
          status: TransactionStatus.SUCCESS,
          transactionId: `${loan.referenceId}_LOAN`,
          processedAt: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();
    return loan;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const rejectLoan = async (loanId: string, adminId: string, reason?: string) => {
  const loan = await Loan.findById(loanId);
  if (!loan) {
    throw new AppError(httpStatus.NOT_FOUND, "Loan not found");
  }
  if (loan.status !== LoanStatus.PENDING) {
    throw new AppError(httpStatus.BAD_REQUEST, "Only pending loans can be rejected");
  }

  loan.status = LoanStatus.REJECTED;
  loan.rejectedBy = new Types.ObjectId(adminId);
  loan.rejectionReason = reason;
  await loan.save();
  return loan;
};

const repayLoan = async (userId: string, loanId: string, amount?: number) => {
  const session = await Loan.startSession();
  session.startTransaction();

  try {
    const loan = await Loan.findOne({ _id: loanId, user: userId }).session(session);
    if (!loan) {
      throw new AppError(httpStatus.NOT_FOUND, "Loan not found");
    }
    if (loan.status !== LoanStatus.APPROVED) {
      throw new AppError(httpStatus.BAD_REQUEST, "Only approved loans can be repaid");
    }

    const repayAmount = amount ?? loan.amount - (loan.repaidAmount || 0);
    if (repayAmount <= 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid repayment amount");
    }

    const debitRes = await Wallet.updateOne(
      { user: userId, balance: { $gte: repayAmount } },
      { $inc: { balance: -repayAmount }, $set: { lastTransactionAt: new Date() } },
      { session },
    );
    if (debitRes.matchedCount === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance for repayment");
    }

    loan.repaidAmount = (loan.repaidAmount || 0) + repayAmount;
    if (loan.repaidAmount >= loan.amount) {
      loan.status = LoanStatus.REPAID;
      loan.repaidAt = new Date();
    }
    await loan.save({ session });

    await Transaction.create(
      [
        {
          sender: userId,
          amount: repayAmount,
          fee: 0,
          type: TransactionType.WITHDRAW,
          entry: TransactionEntry.DEBIT,
          referenceId: `${loan.referenceId}_REPAY`,
          status: TransactionStatus.SUCCESS,
          transactionId: `${loan.referenceId}_REPAY_${Date.now()}`,
          processedAt: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();
    return loan;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getMyRepayments = async (userId: string, query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Transaction.find({
      sender: userId,
      type: TransactionType.WITHDRAW,
      referenceId: { $regex: "_REPAY" },
    }).sort({ createdAt: -1 }),
    query,
  );
  const repayments = queryBuilder.filter().sort().paginate();
  const [data, meta] = await Promise.all([repayments.build(), queryBuilder.getMeta()]);
  return { data, meta };
};
export const LoanService = {
  requestLoan,
  getMyLoans,
  getAllLoans,
  approveLoan,
  rejectLoan,
  repayLoan,
  getMyRepayments
};
