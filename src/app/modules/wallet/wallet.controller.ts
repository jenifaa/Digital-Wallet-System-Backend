/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { walletService } from "./wallet.service";
import { JwtPayload } from "jsonwebtoken";
import { sendResponse } from "../../utils/sendResponse";

const getMyWallet = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await walletService.getMyWallet(decodedToken.userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Retrieved Successfully",
      data: result,
    });
  },
);

const getAllWallets = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await walletService.getAllWallets(
      query as Record<string, string>,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "All Wallets Retrieved Successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const blockWallet = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const walletId = req.params.id as string;

    const result = await walletService.blockWallet(walletId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Wallet Blocked Successfully",
      data: result,
    });
  },
);

const unblockWallet = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const walletId = req.params.id as string;

    const result = await walletService.unblockWallet(walletId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Wallet unblocked Successfully",
      data: result,
    });
  },
);

export const WalletController = {
  getMyWallet,
  getAllWallets,
  blockWallet,
  unblockWallet,
};
