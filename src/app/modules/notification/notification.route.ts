import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { NotificationController } from "./notification.controller";
import {
  broadcastNotificationSchema,
  sendNotificationSchema,
} from "./notification.validation";


const router = Router();

router.get(
  "/my",
  checkAuth(...Object.values(Role)),
  NotificationController.getMyNotifications,
);

router.patch(
  "/read-all",
  checkAuth(...Object.values(Role)),
  NotificationController.markAllAsRead,
);

router.patch(
  "/read/:id",
  checkAuth(...Object.values(Role)),
  NotificationController.markAsRead,
);
router.get("/unread-count", checkAuth(...Object.values(Role)), NotificationController.countUnread);

router.post(
  "/send",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(sendNotificationSchema),
  NotificationController.sendToUser,
);

router.post(
  "/broadcast",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(broadcastNotificationSchema),
  NotificationController.broadcast,
);



export const NotificationRoutes = router;
