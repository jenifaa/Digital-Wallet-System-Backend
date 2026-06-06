/* eslint-disable @typescript-eslint/no-explicit-any */

import { Server } from "http";

import mongoose from "mongoose";
import { envVars } from "./app/config/env";
import app from "./app";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";
import { connectRedis } from "./app/config/redis.config";
import { SettingsService } from "./app/modules/settings/settings.service";

let server: Server;
let isConnected = false;

const initializeContext = async () => {
  if (isConnected) return;
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(envVars.DB_URL);
      console.log("✅ Connected to MongoDB");
    }
    await connectRedis();
    await seedSuperAdmin();
    await SettingsService.getSettings();
    isConnected = true;
    console.log("✅ App initialized successfully");
  } catch (error) {
    console.error("❌ Initialization error:", error);
    // ✅ don't rethrow — app continues even if something fails
  }
};

// 1. Conditionally Start Server locally (Skips this block on Vercel)
if (!process.env.VERCEL) {
  initializeContext().then(() => {
    server = app.listen(envVars.PORT, () => {
      console.log(`✅ Server is listening at port ${envVars.PORT}`);
    });
  });
}

// Global error handlers...
process.on("SIGTERM", () => {
  console.log("SIGTERM detected");
  if (!process.env.VERCEL && server) {
    server.close(() => process.exit(1));
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ UnhandledRejection detected:", reason);
  if (!process.env.VERCEL && server) {
    server.close(() => process.exit(1));
  }
});

process.on("uncaughtException", (error) => {
  console.error("❌ uncaughtException detected:", error);
  if (!process.env.VERCEL && server) {
    server.close(() => process.exit(1));
  }
});

export default async (req: any, res: any) => {
  await initializeContext();
  return app(req, res);
};
