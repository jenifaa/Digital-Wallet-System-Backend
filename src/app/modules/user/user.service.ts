import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser } from "./user.interface";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
const createUser = async (payload: Partial<IUser>) => {
  const { email, password, phone, ...rest } = payload;
  const isUserExist = await User.findOne({ phone });
  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  const isEmailExist = await User.findOne({ email });
  if (isEmailExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email already exists");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };
  const user = await User.create({
    email,
    password: hashedPassword,
    phone,
    auths: [authProvider],
    ...rest,
  });

  return user;
};

export const userServices = {
  createUser,
};
