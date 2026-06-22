import { CookieOptions } from "express";


// const isProduction = envVars.NODE_ENV === "production";

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  // sameSite: isProduction ? "none" : "lax",
  sameSite: "none",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const clearAuthCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
};
