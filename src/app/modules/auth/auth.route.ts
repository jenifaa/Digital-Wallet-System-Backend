import { NextFunction, Request, Response, Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import passport from "passport";
import { authRateLimiter } from "../../middlewares/rateLimiter";
import { envVars } from "../../config/env";

const router = Router();
router.post("/login", authRateLimiter, AuthControllers.credentialsLogin);
router.post("/refresh-token", AuthControllers.getNewAccessToken);
router.post("/logout", AuthControllers.logout);
router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  AuthControllers.changePassword,
);


router.post(
  "/set-password",
  checkAuth(...Object.values(Role)),
  AuthControllers.setPassword,
);

router.post(
  "/forget-password",
  authRateLimiter,
  AuthControllers.forgetPassword
);

router.post(
  "/reset-password-token",
  authRateLimiter,
  AuthControllers.resetPasswordWithToken,
);

router.post(
  "/reset-password",
  checkAuth(...Object.values(Role)),
  AuthControllers.resetPassword,
);
router.post("/set-phone", AuthControllers.setPhone);
router.get(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";

    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect as string,
    })(req, res, next);
  }
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${envVars.FRONTEND_URL}/login?error=There is some issue with your account. Please contact with our support team!`,
  }),
  AuthControllers.googleCallbackController
);

export const AuthRoutes = router;
