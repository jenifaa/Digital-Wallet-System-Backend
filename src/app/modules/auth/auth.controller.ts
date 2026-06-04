/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status-codes";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { createUserToken } from "../../utils/userTokens";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import passport from "passport";
import { AuthServices } from "./auth.service";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { IUser } from "../user/user.interface";

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return next(err.message);
      }

      if (!user) {
        return next(new AppError(401, info.message));
      }

      const userTokens = await createUserToken(user);

      const { password: pass, ...rest } = user.toObject();

      setAuthCookie(res, userTokens);

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Login Successfully",
        data: {
          accessToken: userTokens.accessToken,
          refreshToken: userTokens.refreshToken,
          user: rest,
        },
      });
    })(req, res, next);
  },
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logout Successfully",
      data: null,
    });
  },
);

const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const decodedToken = req.user;

    await AuthServices.changePassword(
      oldPassword,
      newPassword,
      decodedToken as JwtPayload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Changed Successfully",
      data: null,
    });
  },
);
const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No refresh token received from cookies",
      );
    }
    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string,
    );

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "New Access token retrieved Successfully",
      data: tokenInfo,
    });
  },
);
const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;

    await AuthServices.resetPassword(req.body, decodedToken as JwtPayload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Reset Successfully",
      data: null,
    });
  },
);
const setPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const { password } = req.body || {};
    await AuthServices.setPassword(decodedToken.userId, password);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Set Successfully",
      data: null,
    });
  },
);

const forgetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body || {};
    await AuthServices.forgetPassword(email);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Email Sent Successfully",
      data: null,
    });
  },
);

// const googleCallbackController = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     console.log(req.query.state);
//     let redirectTo = req.query.state ? (req.query.state as string) : "";
//     if (redirectTo.startsWith("/")) {
//       redirectTo = redirectTo.slice(1);
//     }

//     const user = req.user;

//     if (!user) {
//       throw new AppError(httpStatus.NOT_FOUND, "User not found");
//     }

//     const tokenInfo = await createUserToken(user);

//     setAuthCookie(res, tokenInfo);

//     res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`);
//   },
// );

const googleCallbackController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let redirectTo = (req.query.state as string) || "";
    if (redirectTo.startsWith("/")) {
      redirectTo = redirectTo.slice(1);
    }

    const user = req.user as IUser & Document;

    console.log("USER FROM PASSPORT:", JSON.stringify(user)); 

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (!user.phone) {
      return res.redirect(
        `${envVars.FRONTEND_URL}/set-phone?userId=${user._id}&next=${redirectTo}`,
      );
    }

    const tokenInfo = await createUserToken(user);
    setAuthCookie(res, tokenInfo);

    return res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`);
    // return res.redirect(
    //   `${envVars.FRONTEND_URL}/${redirectTo}?accessToken=${tokenInfo.accessToken}&refreshToken=${tokenInfo.refreshToken}`,
    // );
  },
);

const setPhone = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, phone } = req.body;

    if (!userId || !phone) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "userId and phone are required",
      );
    }

    const user = await AuthServices.setPhone(userId, phone);

    const tokenInfo = await createUserToken(user);
    setAuthCookie(res, tokenInfo);

    const { password, ...rest } = user.toObject();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Phone set successfully",
      data: {
        accessToken: tokenInfo.accessToken,
        refreshToken: tokenInfo.refreshToken,
        user: rest,
      },
    });
  },
);

export const AuthControllers = {
  credentialsLogin,
  logout,
  getNewAccessToken,
  changePassword,
  resetPassword,
  setPassword,
  forgetPassword,
  googleCallbackController,
  setPhone,
};
