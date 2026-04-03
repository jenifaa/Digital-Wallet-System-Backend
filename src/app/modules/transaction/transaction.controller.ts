/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { transactionService } from "./transaction.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";



const AddMoney = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { amount } = req.body;


      const userId = req.params.id;

      const result = await transactionService.addMoney(amount, userId as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Retrieved Successfully",
      data: result,
    });
  },
);

export const transactionController={
    AddMoney
}