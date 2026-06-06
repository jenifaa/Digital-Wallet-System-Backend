import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { updateSettingsSchema } from "./settings.validation";
import { SettingsController } from "./settings.controller";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SettingsController.getSettings,
);

router.patch(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateSettingsSchema),
  SettingsController.updateSettings,
);

export const SettingsRoutes = router;
