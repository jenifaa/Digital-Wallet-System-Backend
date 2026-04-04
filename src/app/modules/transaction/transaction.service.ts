import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
} from "./transaction.interface";
import { Transaction } from "./transaction.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";

const getTransactionId = () => {
  return `trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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

    let fee = 0;
    if ((payload?.amount as number) <= 50) {
      fee = 5;
    }

    const totalPayable = (payload.amount as number) + fee;

    const transaction = await Transaction.create(
      [
        {
          sender: user._id,
          amount: payload.amount,
          fee: payload.fee,
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



export const transactionService = {
  addMoney,

};
