import { z } from "zod";
import { NotificationType } from "./notification.interface";




export const sendNotificationSchema = z.object({
 
    title: z.string(),
    message: z.string(),
    type: z.enum(["ADMIN", "BROADCAST", "SYSTEM"]),
    recipient: z.string().optional(),
    role: z.string().optional(),
 
});


export const broadcastNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  role: z.string().optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().min(1),
});
