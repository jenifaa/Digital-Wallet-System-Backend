import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from "./stats.service";

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getUserStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User stats fetched successfully",
    data: stats,
  });
});

const getWalletStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getWalletStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wallet stats fetched successfully",
    data: stats,
  });
});

const getTransactionStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getTransactionStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Transaction stats fetched successfully",
    data: stats,
  });
});

const getLoanStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getLoanStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Loan stats fetched successfully",
    data: stats,
  });
});

const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getDashboardOverview();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard overview fetched successfully",
    data: stats,
  });
});

const getUserGrowthAnalytics = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getUserGrowthAnalytics();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User growth analytics fetched successfully",
    data: stats,
  });
});

const getTransactionGrowthAnalytics = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getTransactionGrowthAnalytics();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Transaction growth analytics fetched successfully",
    data: stats,
  });
});

const getPaymentStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await StatsService.getPaymentStats();

  sendResponse(res, {
    success: true,
    statusCode:200,
    message: "Payment statistics retrieved successfully",
    data: result,
  });
});

export const StatsController = {
  getWalletStats,
  getLoanStats,
  getUserStats,
  getTransactionStats,
  getDashboardOverview,
  getUserGrowthAnalytics,
  getTransactionGrowthAnalytics,
  getPaymentStats
};
