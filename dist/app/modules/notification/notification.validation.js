"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationIdParamSchema = exports.broadcastNotificationSchema = exports.sendNotificationSchema = void 0;
const zod_1 = require("zod");
exports.sendNotificationSchema = zod_1.z.object({
    title: zod_1.z.string(),
    message: zod_1.z.string(),
    type: zod_1.z.enum(["ADMIN", "BROADCAST", "SYSTEM"]),
    recipient: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
});
exports.broadcastNotificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    role: zod_1.z.string().optional(),
});
exports.notificationIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
});
