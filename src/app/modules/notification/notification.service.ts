import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { User } from "../user/user.model";
import { INotification, NotificationType } from "./notification.interface";
import { Notification } from "./notification.model";

const sendToUser = async (
  payload: Pick<INotification, "title" | "message" | "recipient" | "sender" | "type">,
) => {
  const user = await User.findById(payload.recipient);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Recipient not found");
  }

  return Notification.create({
    ...payload,
    read: false,
  });
};

const broadcast = async (
  payload: Pick<INotification, "title" | "message" | "sender">,
  roleFilter?: string,
) => {
  const filter = roleFilter ? { role: roleFilter, isDeleted: false } : { isDeleted: false };
  const users = await User.find(filter).select("_id");

  if (users.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No users found for broadcast");
  }

  const notifications = users.map((user) => ({
    title: payload.title,
    message: payload.message,
    recipient: user._id,
    sender: payload.sender,
    type: NotificationType.BROADCAST,
    read: false,
  }));

  await Notification.insertMany(notifications);
  return { count: notifications.length };
};

const getMyNotifications = async (userId: string, query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Notification.find({ recipient: userId })
      .populate("sender", "name email role")
      .sort({ createdAt: -1 }),
    query,
  );
  const notifications = queryBuilder.filter().sort().paginate();
  const [data, meta] = await Promise.all([
    notifications.build(),
    queryBuilder.getMeta(),
  ]);
  return { data, meta };
};

const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true },
  );
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
  }
  return notification;
};

const markAllAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true },
  );
  return { modifiedCount: result.modifiedCount };
};

export const NotificationService = {
  sendToUser,
  broadcast,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
