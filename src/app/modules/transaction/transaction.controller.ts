import  httpStatus  from 'http-status-codes';
import { Request, Response } from "express";

import { TransactionService } from "./transaction.service";
import { catchAsync } from "../../utils/catchAsync";


const sendMoney = catchAsync(async (req: Request, res: Response) => {
  const senderId = req.params.id; // from auth middleware
  const { receiverId, amount } = req.body;

  const result = await TransactionService.sendMoney(
    senderId as string,
    receiverId,
    amount
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: "Money sent successfully",
    data: result,
  });
});

export const TransactionController = {
  sendMoney,
};