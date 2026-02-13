import AppError from "../../errorHelpers/AppError";
import { IUser } from "./user.interface";
import { User } from "./user.model";
import bcryptjs from "bcryptjs"
import httpStatus from "http-status-codes";
const createUser = async (payload: Partial<IUser>) => {
  const { email, password,phone, ...rest } = payload;
  const isUserExist = await User.findOne({ phone });
  if(isUserExist){
       throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  const hashedPassword = await bcryptjs.hash(password as string,
    10
  )

  return {};
};

export const userServices = {
  createUser,
};
