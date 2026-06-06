import { Response } from "express";
import {
  accessTokenCookieOptions,
  clearAuthCookieOptions,
  refreshTokenCookieOptions,
} from "./cookieOptions";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", clearAuthCookieOptions);
  res.clearCookie("refreshToken", clearAuthCookieOptions);
};

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  clearAuthCookies(res);

  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, accessTokenCookieOptions);
  }

  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, refreshTokenCookieOptions);
  }
};
