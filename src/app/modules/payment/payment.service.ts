/* eslint-disable @typescript-eslint/no-explicit-any */
// import httpStatus from "http-status-codes";
import { Transaction } from "../transaction/transaction.model";
import { TransactionStatus } from "../transaction/transaction.interface";
import AppError from "../../errorHelpers/AppError";

import { Wallet } from "../wallet/wallet.model";




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

const successPayment = async (query: Record<string, string>) => {
  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Transaction.findOneAndUpdate(
      { transactionId: query.transactionId },
      { status: TransactionStatus.SUCCESS },
      { new: true, runValidators: true, session }
    );

    if (!updatedPayment) throw new AppError(401, "Transaction not found");

    // Find user's wallet by user id
    const wallet = await Wallet.findOne({ user: updatedPayment.sender }).session(session);
    if (!wallet) throw new AppError(404, "User wallet not found");

    wallet.balance = (wallet.balance || 0) + updatedPayment.amount;
    await wallet.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { success: true, message: "Transaction Completed Successfully" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
   
};