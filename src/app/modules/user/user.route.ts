import { Router } from "express";
import { userControllers } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createUserZodSchema,
  rejectAgentSchema,
  updateUserProfileZodSchema,
  updateUserZodSchema,
} from "./user.validation";
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
  "/search",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userControllers.searchUsers,
);

router.get(
  "/search/agents",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userControllers.searchAgents,
);

router.get(
  "/all-users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userControllers.getAllUsers,
);

router.get("/me", checkAuth(...Object.values(Role)), userControllers.getMe);

router.post(
  "/apply-agent",
  checkAuth(Role.USER),
  userControllers.applyForAgent,
);

router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userControllers.getSingleUser,
);

router.patch(
  "/profile",
  multerUpload.single("file"),
  validateRequest(updateUserProfileZodSchema),
  checkAuth(...Object.values(Role)),
  userControllers.updateUserProfile,
);

router.patch(
  "/:id",
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

router.patch(
  "/reject-agent/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(rejectAgentSchema),
  userControllers.rejectAgent,
);

router.patch(
  "/suspend-agent/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(rejectAgentSchema),
  userControllers.suspendAgent,
);

router.patch(
  "/reactivate-agent/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userControllers.reactivateAgent,
);

export const UserRoutes = router;
