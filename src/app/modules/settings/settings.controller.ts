import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SettingsService } from "./settings.service";
import { JwtPayload } from "jsonwebtoken";
import { AuditAction } from "../audit/audit.interface";
import { AuditService } from "../audit/audit.service";

const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const settings = await SettingsService.getSettings();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Settings retrieved successfully",
    data: settings,
  });
});

const updateSettings = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const decoded = req.user as JwtPayload;
  const settings = await SettingsService.updateSettings(req.body, decoded.userId);

  await AuditService.logAudit(req, AuditAction.SETTINGS_UPDATE, {
    performedBy: decoded.userId,
    details: req.body,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Settings updated successfully",
    data: settings,
  });
});

export const SettingsController = {
  getSettings,
  updateSettings,
};
