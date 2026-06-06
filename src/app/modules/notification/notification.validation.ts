import { z } from "zod";
import { NotificationType } from "./notification.interface";

export const sendNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  recipient: z.string().min(1),
  type: z.nativeEnum(NotificationType).optional().default(NotificationType.ADMIN),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  role: z.string().optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().min(1),
});
