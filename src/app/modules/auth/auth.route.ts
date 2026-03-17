import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();
router.post("/login", AuthControllers.credentialsLogin);

router.post("/logout", AuthControllers.logout);
router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  AuthControllers.changePassword
);
router.post(
  "/set-password",
  checkAuth(...Object.values(Role)),
  AuthControllers.setPassword
);
router.post(
  "/forget-password",

  AuthControllers.forgetPassword
);
router.post(
  "/reset-password",
  checkAuth(...Object.values(Role)),
  AuthControllers.resetPassword
);
export const AuthRoutes = router;
