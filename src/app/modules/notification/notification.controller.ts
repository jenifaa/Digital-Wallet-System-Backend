import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";
import { NotificationType } from "./notification.interface";
import { AuditAction } from "../audit/audit.interface";
import { AuditService } from "../audit/audit.service";

const sendToUser = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const decoded = req.user as JwtPayload;
  const { type, title, message, recipient, role } = req.body;

  let result;

  if (type === NotificationType.BROADCAST) {
    result = await NotificationService.broadcast(
      {
        title,
        message,
        sender: decoded.userId as unknown as import("mongoose").Types.ObjectId,
      },
      role,
    );
  } else {
    result = await NotificationService.sendToUser({
      title,
      message,
      recipient,
      sender: decoded.userId as unknown as import("mongoose").Types.ObjectId,
      type,
    });
  }

  await AuditService.logAudit(req, AuditAction.NOTIFICATION_SEND, {
    targetType: "User",
    targetId: recipient,
    performedBy: decoded.userId,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: type === NotificationType.BROADCAST
      ? "Broadcast sent successfully"
      : "Notification sent successfully",
    data: result,
  });
});

const broadcast = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const decoded = req.user as JwtPayload;
  const result = await NotificationService.broadcast(
    {
      title: req.body.title,
      message: req.body.message,
      sender: decoded.userId as unknown as import("mongoose").Types.ObjectId,
    },
    req.body.role,
  );

  await AuditService.logAudit(req, AuditAction.NOTIFICATION_SEND, {
    performedBy: decoded.userId,
    details: { broadcast: true, count: result.count },
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Broadcast notification sent successfully",
    data: result,
  });
});

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const decoded = req.user as JwtPayload;
  const result = await NotificationService.getMyNotifications(
    decoded.userId,
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notifications retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const decoded = req.user as JwtPayload;
  const notification = await NotificationService.markAsRead(decoded.userId, String(req.params.id));

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notification marked as read",
    data: notification,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const decoded = req.user as JwtPayload;
  const result = await NotificationService.markAllAsRead(decoded.userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All notifications marked as read",
    data: result,
  });
});

const countUnread = catchAsync(async (req: Request, res: Response) => {
  const decoded = req.user as JwtPayload;
  const result = await NotificationService.countUnread(decoded.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unread notification count fetched successfully",
    data: result,
  });
});

export const NotificationController = {
  sendToUser,
  broadcast,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  countUnread
};
