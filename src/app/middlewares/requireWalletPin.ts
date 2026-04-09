/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import bcryptjs from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../errorHelpers/AppError";
import { Wallet } from "../modules/wallet/wallet.model";

export const requireWalletPin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const decodedToken = req.user as JwtPayload | undefined;
  if (!decodedToken?.userId) {
    return next(new AppError(httpStatus.UNAUTHORIZED, "Unauthorized"));
  }

  const pin = String((req.body as any)?.pin ?? "").trim();
  if (!pin) {
    return next(new AppError(httpStatus.BAD_REQUEST, "PIN is required"));
  }

  const wallet = await Wallet.findOne({ user: decodedToken.userId }).select(
    "+security.pinHash security.isPinSet",
  );
  if (!wallet) {
    return next(new AppError(httpStatus.NOT_FOUND, "Wallet not found"));
  }

  if (!wallet.security?.isPinSet || !wallet.security?.pinHash) {
    return next(
      new AppError(
        httpStatus.BAD_REQUEST,
        "Please set wallet PIN before your first transaction",
      ),
    );
  }

  const ok = await bcryptjs.compare(pin, wallet.security.pinHash);
  if (!ok) {
    return next(new AppError(httpStatus.UNAUTHORIZED, "Invalid PIN"));
  }

  return next();
};

