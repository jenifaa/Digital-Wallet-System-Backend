import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../modules/user/user.interface";
import { Document } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: (IUser & Document) | JwtPayload;
    }
  }
}
