/* eslint-disable @typescript-eslint/no-unused-vars */
import  httpStatus from 'http-status-codes';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { createUserToken } from "../../utils/userTokens";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from '../../utils/setCookie';
import passport from 'passport';

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

export const AuthControllers = {
  credentialsLogin,
};
