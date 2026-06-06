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
exports.NotificationService = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const user_model_1 = require("../user/user.model");
const notification_interface_1 = require("./notification.interface");
const notification_model_1 = require("./notification.model");
const sendToUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(payload.recipient);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Recipient not found");
    }
    return notification_model_1.Notification.create(Object.assign(Object.assign({}, payload), { read: false }));
});
const broadcast = (payload, roleFilter) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = roleFilter ? { role: roleFilter, isDeleted: false } : { isDeleted: false };
    const users = yield user_model_1.User.find(filter).select("_id");
    if (users.length === 0) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "No users found for broadcast");
    }
    const notifications = users.map((user) => ({
        title: payload.title,
        message: payload.message,
        recipient: user._id,
        sender: payload.sender,
        type: notification_interface_1.NotificationType.BROADCAST,
        read: false,
    }));
    yield notification_model_1.Notification.insertMany(notifications);
    return { count: notifications.length };
});
const getMyNotifications = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(notification_model_1.Notification.find({ recipient: userId })
        .populate("sender", "name email role")
        .sort({ createdAt: -1 }), query);
    const notifications = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([
        notifications.build(),
        queryBuilder.getMeta(),
    ]);
    return { data, meta };
});
const markAsRead = (userId, notificationId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, recipient: userId }, { read: true }, { new: true });
    if (!notification) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Notification not found");
    }
    return notification;
});
const markAllAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.updateMany({ recipient: userId, read: false }, { read: true });
    return { modifiedCount: result.modifiedCount };
});
exports.NotificationService = {
    sendToUser,
    broadcast,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
};
