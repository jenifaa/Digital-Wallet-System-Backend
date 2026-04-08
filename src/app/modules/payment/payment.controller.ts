/* eslint-disable no-console */
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { PaymentService } from "./payment.service";
import { envVars } from "../../config/env";
import { sendResponse } from "../../utils/sendResponse";
import { SSLService } from "../sslCommerz/sslCommerz.service";


const successPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await PaymentService.successPayment(
    query as Record<string, string>,
  );
  res.redirect(
    `${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`,
  );
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await PaymentService.failPayment(query as Record<string, string>);
  res.redirect(
    `${envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`,
  );
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await PaymentService.cancelPayment(
    query as Record<string, string>,
  );
  res.redirect(
    `${envVars.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`,
  );
});
// const getInvoiceDownloadUrl = catchAsync(
//   async (req: Request, res: Response) => {
//     const { paymentId } = req.params;
//     const result = await PaymentService.getInvoiceDownloadUrl(paymentId);
//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: "Invoice url retrieve  successfully",
//       data: result,
//     });
//   },
// );

const validatePayment = catchAsync(async (req: Request, res: Response) => {
 
  console.log("SSLCommerz ipn",req.body);
 
  await SSLService.validatePayment(req.body);
  // IPN is the most reliable post-payment signal; attempt processing idempotently.
  if (req.body?.tran_id) {
    await PaymentService.successPayment({
      tran_id: String(req.body.tran_id),
    } as Record<string, string>);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment Validated  successfully",
    data: null,
  });
});

export const PaymentController = {
  successPayment,
  failPayment,
  cancelPayment,
  // initPayment,
  // getInvoiceDownloadUrl,
  validatePayment,
};
