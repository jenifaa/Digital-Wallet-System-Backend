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
exports.PaymentService = {
    // initPayment,
    successPayment,
    failPayment,
    cancelPayment,
};
