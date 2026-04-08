/* eslint-disable @typescript-eslint/no-explicit-any */
import { Transaction } from "../transaction/transaction.model";
import {
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.interface";
import AppError from "../../errorHelpers/AppError";

import { Wallet } from "../wallet/wallet.model";
import { envVars } from "../../config/env";
import { User } from "../user/user.model";
import httpStatus from "http-status-codes";




// const initPayment = async (bookingId: string) => {

//     const payment = await Payment.findOne({ booking: bookingId })

//     if (!payment) {
//         throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found. You have not booked this tour")
//     }

//     const booking = await Booking.findById(payment.booking)

//     const userAddress = (booking?.user as any).address
//     const userEmail = (booking?.user as any).email
//     const userPhoneNumber = (booking?.user as any).phone
//     const userName = (booking?.user as any).name

//     const sslPayload: ISSLCommerz = {
//         address: userAddress,
//         email: userEmail,
//         phoneNumber: userPhoneNumber,
//         name: userName,
//         amount: payment.amount,
//         transactionId: payment.transactionId
//     }

//     const sslPayment = await SSLService.sslPaymentInit(sslPayload)

//     return {
//         paymentUrl: sslPayment.GatewayPageURL
//     }

// };
// const successPayment = async (query: Record<string, string>) => {


//     const session = await Transaction.startSession();
//     session.startTransaction()

//     try {


//         const updatedPayment = await Transaction.findOneAndUpdate({ transactionId: query.transactionId }, {
//             status: TransactionStatus.SUCCESS,
//         }, { new: true, runValidators: true, session: session })

//         if (!updatedPayment) {
//             throw new AppError(401, "Transaction not found")
//         }

   

//         // const invoiceData: IInvoiceData = {
//         //     bookingDate: updatedBooking.createdAt as Date,
//         //     guestCount: updatedBooking.guestCount,
//         //     totalAmount: updatedPayment.amount,
//         //     tourTitle: (updatedBooking.tour as unknown as ITour).title,
//         //     transactionId: updatedPayment.transactionId,
//         //     userName: (updatedBooking.user as unknown as IUser).name
//         // }

//         // const pdfBuffer = await generatePdf(invoiceData)

//         // const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice")

//         // if (!cloudinaryResult) {
//         //     throw new AppError(401, "Error uploading pdf")
//         // }

//         // await Payment.findByIdAndUpdate(updatedPayment._id, { invoiceUrl: cloudinaryResult.secure_url }, { runValidators: true, session })

//         // await sendEmail({
//         //     to: (updatedBooking.user as unknown as IUser).email,
//         //     subject: "Your Booking Invoice",
//         //     templateName: "invoice",
//         //     templateData: invoiceData,
//         //     attachments: [
//         //         {
//         //             filename: "invoice.pdf",
//         //             content: pdfBuffer,
//         //             contentType: "application/pdf"
//         //         }
//         //     ]
//         // })

//         await session.commitTransaction(); //transaction
//         session.endSession()
//         return { success: true, message: "Transaction Completed Successfully" }
//     } catch (error) {
//         await session.abortTransaction(); // rollback
//         session.endSession()
//         // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
//         throw error
//     }
// };

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
    const trx = await Transaction.findOne({ transactionId: args.transactionId })
      .session(session)
      .exec();

    if (!trx) {
      throw new AppError(httpStatus.NOT_FOUND, "Transaction not found");
    }

    // Idempotency: only process once from PENDING -> final
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
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Unsupported payment transaction type",
        );
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
      args.status === "fail"
        ? TransactionStatus.FAILED
        : TransactionStatus.REVERSED;

    const updated = await Transaction.findOneAndUpdate(
      { transactionId: args.transactionId, status: TransactionStatus.PENDING },
      { status: nextStatus, processedAt: new Date() },
      { new: true, runValidators: true, session },
    );

    if (!updated) {
      await session.commitTransaction();
      session.endSession();
      return { success: false, message: "Callback already processed" };
    }

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

const successPayment = async (query: Record<string, string>) => {
  return processGatewayCallback({
    transactionId: query.transactionId || query.tran_id || query.tranId,
    status: "success",
  });
};

const failPayment = async (query: Record<string, string>) => {
  return processGatewayCallback({
    transactionId: query.transactionId || query.tran_id || query.tranId,
    status: "fail",
  });
};

const cancelPayment = async (query: Record<string, string>) => {
  return processGatewayCallback({
    transactionId: query.transactionId || query.tran_id || query.tranId,
    status: "cancel",
  });
};






// const failPayment = async (query: Record<string, string>) => {

//     // Update Booking Status to FAIL
//     // Update Payment Status to FAIL

//     const session = await Booking.startSession();
//     session.startTransaction()

//     try {


//         const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
//             status: PAYMENT_STATUS.FAILED,
//         }, { new: true, runValidators: true, session: session })

//         await Booking
//             .findByIdAndUpdate(
//                 updatedPayment?.booking,
//                 { status: BOOKING_STATUS.FAILED },
//                 { runValidators: true, session }
//             )

//         await session.commitTransaction(); //transaction
//         session.endSession()
//         return { success: false, message: "Payment Failed" }
//     } catch (error) {
//         await session.abortTransaction(); // rollback
//         session.endSession()
//         // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
//         throw error
//     }
// };
// const cancelPayment = async (query: Record<string, string>) => {

//     // Update Booking Status to CANCEL
//     // Update Payment Status to CANCEL

//     const session = await Booking.startSession();
//     session.startTransaction()

//     try {


//         const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
//             status: PAYMENT_STATUS.CANCELLED,
//         }, { runValidators: true, session: session })

//         await Booking
//             .findByIdAndUpdate(
//                 updatedPayment?.booking,
//                 { status: BOOKING_STATUS.CANCEL },
//                 { runValidators: true, session }
//             )

//         await session.commitTransaction(); //transaction
//         session.endSession()
//         return { success: false, message: "Payment Cancelled" }
//     } catch (error) {
//         await session.abortTransaction(); // rollback
//         session.endSession()
//         // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
//         throw error
//     }
// };

// const getInvoiceDownloadUrl = async (paymentId: string) => {
//     const payment = await Payment.findById(paymentId)
//         .select("invoiceUrl")

//     if (!payment) {
//         throw new AppError(401, "Payment not found")
//     }

//     if (!payment.invoiceUrl) {
//         throw new AppError(401, "No invoice found")
//     }

//     return payment.invoiceUrl
// };


export const PaymentService = {
    // initPayment,
    successPayment,
    failPayment,
    cancelPayment,
   
};