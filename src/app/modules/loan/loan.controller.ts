import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { LoanService } from "./loan.service";
import { AuditAction } from "../audit/audit.interface";
import { AuditService } from "../audit/audit.service";

const requestLoan = catchAsync(async (req: Request, res: Response) => {
  const decoded = req.user as JwtPayload;
  const loan = await LoanService.requestLoan(decoded.userId, req.body.amount);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Loan request submitted successfully",
    data: loan,
  });
});

const getMyLoans = catchAsync(async (req: Request, res: Response) => {
  const decoded = req.user as JwtPayload;
  const result = await LoanService.getMyLoans(decoded.userId, req.query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Loan history retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getAllLoans = catchAsync(async (req: Request, res: Response) => {
  const result = await LoanService.getAllLoans(req.query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Loan requests retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const approveLoan = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const decoded = req.user as JwtPayload;
  const loan = await LoanService.approveLoan(String(req.params.id), decoded.userId);

  await AuditService.logAudit(req, AuditAction.LOAN_APPROVE, {
    targetType: "Loan",
    targetId: String(req.params.id),
    performedBy: decoded.userId,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Loan approved and credited to wallet",
    data: loan,
  });
});

const rejectLoan = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const decoded = req.user as JwtPayload;
  const loan = await LoanService.rejectLoan(String(req.params.id), decoded.userId, req.body.reason);

  await AuditService.logAudit(req, AuditAction.LOAN_REJECT, {
    targetType: "Loan",
    targetId: String(req.params.id),
    performedBy: decoded.userId,
    details: { reason: req.body.reason },
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Loan rejected",
    data: loan,
  });
});

const repayLoan = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const decoded = req.user as JwtPayload;
  const loan = await LoanService.repayLoan(decoded.userId, String(req.params.id), req.body.amount);

  await AuditService.logAudit(req, AuditAction.LOAN_REPAY, {
    targetType: "Loan",
    targetId: String(req.params.id),
    performedBy: decoded.userId,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Loan repayment recorded",
    data: loan,
  });
});

export const LoanController = {
  requestLoan,
  getMyLoans,
  getAllLoans,
  approveLoan,
  rejectLoan,
  repayLoan,
};
