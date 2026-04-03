import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { TransactionStatus, TransactionType } from "./transaction.interface";
import { Transaction } from "./transaction.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";

const getTransactionId = () => {
  return `trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

const addMoney = async (amount: number, userId: string) => {
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

  const transactionId = getTransactionId();

  let fee = 0;
  if (amount <= 50) {
    fee = 5;
  }

  const totalPayable = amount + fee;

  const transaction = await Transaction.create({
    sender: user._id,
    amount,
    fee,
    type: TransactionType.ADD,
    status: TransactionStatus.PENDING,
    transactionId,
  });

  const sslResponse = await SSLService.sslPaymentInit({
    amount: totalPayable,
    transactionId,
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  if (sslResponse.status !== "SUCCESS") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      sslResponse.failedreason || "SSL payment initialization failed",
    );
  }

  return {
    message: "Redirect to payment gateway",
    paymentUrl: sslResponse.GatewayPageURL,
    transactionId,
  };
};

export const transactionService = {
  addMoney,
};
