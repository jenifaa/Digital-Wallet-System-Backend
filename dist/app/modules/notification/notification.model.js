"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notification_interface_1 = require("./notification.interface");
const notificationSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipient: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: Object.values(notification_interface_1.NotificationType), required: true },
    read: { type: Boolean, default: false, index: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
