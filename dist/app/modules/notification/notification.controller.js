"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const notification_service_1 = require("./notification.service");
const notification_interface_1 = require("./notification.interface");
const audit_interface_1 = require("../audit/audit.interface");
const audit_service_1 = require("../audit/audit.service");
const sendToUser = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const notification = yield notification_service_1.NotificationService.sendToUser({
        title: req.body.title,
        message: req.body.message,
        recipient: req.body.recipient,
        sender: decoded.userId,
        type: req.body.type || notification_interface_1.NotificationType.ADMIN,
    });
    yield audit_service_1.AuditService.logAudit(req, audit_interface_1.AuditAction.NOTIFICATION_SEND, {
        targetType: "User",
        targetId: req.body.recipient,
        performedBy: decoded.userId,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Notification sent successfully",
        data: notification,
    });
}));
const broadcast = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const result = yield notification_service_1.NotificationService.broadcast({
        title: req.body.title,
        message: req.body.message,
        sender: decoded.userId,
    }, req.body.role);
    yield audit_service_1.AuditService.logAudit(req, audit_interface_1.AuditAction.NOTIFICATION_SEND, {
        performedBy: decoded.userId,
        details: { broadcast: true, count: result.count },
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Broadcast notification sent successfully",
        data: result,
    });
}));
const getMyNotifications = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const result = yield notification_service_1.NotificationService.getMyNotifications(decoded.userId, req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Notifications retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const markAsRead = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const notification = yield notification_service_1.NotificationService.markAsRead(decoded.userId, String(req.params.id));
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Notification marked as read",
        data: notification,
    });
}));
const markAllAsRead = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const result = yield notification_service_1.NotificationService.markAllAsRead(decoded.userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All notifications marked as read",
        data: result,
    });
}));
const countUnread = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const result = yield notification_service_1.NotificationService.countUnread(decoded.userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Unread notification count fetched successfully",
        data: result,
    });
}));
exports.NotificationController = {
    sendToUser,
    broadcast,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    countUnread
};
