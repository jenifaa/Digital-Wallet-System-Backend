import express, { Request, Response } from "express";
import cors from "cors";
import { router } from "./app/routes";
const app = express();

app.use("/api/v1", router);
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Digital Wallet system backend",
  });
});
export default app;