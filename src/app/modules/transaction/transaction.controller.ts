/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { transactionService } from "./transaction.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { SSLService } from "../sslCommerz/sslCommerz.service";

const AddMoney = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;

    const result = await transactionService.addMoney(
      req.body,
      decodedToken.userId,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Money added  Successfully",
      data: result,
    });
  },
);

const SendMoney = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await transactionService.sendMoney(
      req.body,
      decodedToken.userId,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Money sent successfully",
      data: result,
    });
  },
);

const CashIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await transactionService.cashIn(
      req.body,
      decodedToken.userId,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Cash-in successful",
      data: result,
    });
  },
);

const CashOut = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await transactionService.cashOut(
      req.body,
      decodedToken.userId,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Cash-out successful",
      data: result,
    });
  },
);

const Withdraw = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await transactionService.withdraw(
      req.body,
      decodedToken.userId,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Withdraw successful",
      data: result,
    });
  },
);

const successCallback = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const result = await transactionService.successPayment(query);
  res.redirect(
    `${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId || query.tran_id || query.tranId}&message=${result.message}&amount=${query.amount}&status=${query.status}`,
  );
});

const failCallback = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const result = await transactionService.failPayment(query);
  res.redirect(
    `${envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId || query.tran_id || query.tranId}&message=${result.message}&amount=${query.amount}&status=${query.status}`,
  );
});

const cancelCallback = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const result = await transactionService.cancelPayment(query);
  res.redirect(`${envVars.SSL.SSL_CANCEL_FRONTEND_URL}?message=${result.message}`);
});

const GetMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;

  const result = await transactionService.getMyTransactions(
    decodedToken.userId,
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Transactions retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const searchTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await transactionService.searchTransactions(
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Transactions retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const validatePayment = catchAsync(async (req: Request, res: Response) => {
  console.log("SSLCommerz ipn", req.body);

  await SSLService.validatePayment(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment Validated  successfully",
    data: null,
  });
});

export const transactionController = {
  AddMoney,
  Withdraw,
  SendMoney,
  CashIn,
  CashOut,
  successCallback,
  failCallback,
  cancelCallback,
  GetMyTransactions,
  searchTransactions,
  validatePayment,
};
