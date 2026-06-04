import { Router } from "express";
import { userControllers } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.post(
  "/register",
  validateRequest(createUserZodSchema),
  userControllers.createUser,
);
router.get(
  "/all-users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userControllers.getAllUsers,
);

router.get("/me", checkAuth(...Object.values(Role)), userControllers.getMe);
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userControllers.getSingleUser,
);
router.patch(
  "/:id",
  multerUpload.single("file"),
  validateRequest(updateUserZodSchema),

  checkAuth(...Object.values(Role)),
  userControllers.updateUser,
);

router.patch(
  "/make-agent/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userControllers.makeAgent,
);

router.patch(
  "/approve-agent/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userControllers.approveAgent,
);
export const UserRoutes = router;
