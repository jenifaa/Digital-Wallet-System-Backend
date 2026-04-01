// import  httpStatus  from 'http-status-codes';
// import mongoose from "mongoose";
// import { Transaction } from "./transaction.model";
// import { Wallet } from "../wallet/wallet.model";
// import AppError from "../../errorHelpers/AppError";



// const sendMoney = async (
//   senderId: string,
//   receiverId: string,
//   amount: number
// ) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

   
//     if (senderId === receiverId) {
//       throw new AppError(httpStatus.BAD_REQUEST, "Cannot send money to yourself");
//     }

   
//     const senderWallet = await Wallet.findOne({ user: senderId }).session(session);
//     const receiverWallet = await Wallet.findOne({ user: receiverId }).session(session);

//     if (!senderWallet || !receiverWallet) {
//       throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
//     }

   
//     if (senderWallet.balance < amount) {
//       throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
//     }

//     // 💰 Update balances
//     senderWallet.balance -= amount;
//     receiverWallet.balance += amount;

//     await senderWallet.save({ session });
//     await receiverWallet.save({ session });

//     // 🧾 Create transaction record
//     const transaction = await Transaction.create(
//       [
//         {
//           initiatedBy: senderId,
//           from: senderId,
//           to: receiverId,
//           amount,
//           type: "SEND_MONEY",
//           status: "COMPLETED",
//         },
//       ],
//       { session }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     return transaction[0];
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };





// export const TransactionService = {
//   sendMoney,
// };