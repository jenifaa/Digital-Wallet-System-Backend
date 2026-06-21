import cors from "cors";
import express, { Request, Response } from "express";
import passport from "passport";
import cookieParser from "cookie-parser";
import expressSession from "express-session";
import { router } from "./app/routes";
import "./app/config/passport";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { envVars } from "./app/config/env";
const app = express();
app.use(express.json());
app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [envVars.FRONTEND_URL, envVars.FRONTEND_LIVE_URL],
    credentials: true,
  }),
);
app.use("/api", router);
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Digital Wallet system backend",
  });
});
app.use(globalErrorHandler);
app.use(notFound);
export default app;
