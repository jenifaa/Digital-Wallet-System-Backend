import { Server } from "http";

import mongoose from "mongoose";
import { envVars } from "./app/config/env";
import app from "./app";

let server: Server;



const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL);
    console.log("Connected to db");
    server = app.listen(envVars.PORT, () => {
      console.log(`Server is listening at ${envVars.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

(async () => {
  await startServer();
})();

process.on("SIGTERM", () => {
  console.log("SIGTERM detected");
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});
process.on("unhandledRejection", () => {
  console.log("UnhandledRejection detected");
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});
process.on("uncaughtException", () => {
  console.log("uncaughtException detected");
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});
