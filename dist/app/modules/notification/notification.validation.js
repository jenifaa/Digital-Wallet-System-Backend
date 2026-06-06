"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationIdParamSchema = exports.broadcastNotificationSchema = exports.sendNotificationSchema = void 0;
const zod_1 = require("zod");
const notification_interface_1 = require("./notification.interface");
exports.sendNotificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    recipient: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(notification_interface_1.NotificationType).optional().default(notification_interface_1.NotificationType.ADMIN),
});
exports.broadcastNotificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    role: zod_1.z.string().optional(),
});
exports.notificationIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
});
