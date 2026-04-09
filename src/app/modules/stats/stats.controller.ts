import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from "./stats.service";

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getUserStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking stats fetched successfully",
    data: stats,
  });
});
const getWalletStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getWalletStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking stats fetched successfully",
    data: stats,
  });
});
const getTransactionStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getTransactionStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking stats fetched successfully",
    data: stats,
  });
});
const getPaymentStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getPaymentStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking stats fetched successfully",
    data: stats,
  });
});

export const StatsController = {
  getWalletStats,
  getPaymentStats,
  getUserStats,
  getTransactionStats,
};
