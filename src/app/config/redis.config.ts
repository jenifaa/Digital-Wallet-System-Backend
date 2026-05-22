// import { createClient } from "redis";
// import { envVars } from "./env";

// export const redisClient = createClient({
//   username: envVars.REDIS_USERNAME,
//   password: envVars.REDIS_PASSWORD,
//   socket: {
//     host: envVars.REDIS_HOST,
//     port: Number(envVars.REDIS_PORT),
//   },
// });

// redisClient.on("error", (err) => console.log("Redis Client Error", err));

// export const connectRedis = async () => {
//   if (!redisClient.isOpen) {
//     await redisClient.connect();
//   }
// };

import { Redis } from "@upstash/redis";
import { envVars } from "./env";

export const redisClient = new Redis({
  url: envVars.UPSTASH_REDIS_REST_URL,
  token: envVars.UPSTASH_REDIS_REST_TOKEN,
});

// No connectRedis needed — Upstash uses HTTP, no persistent connection
export const connectRedis = async () => {
  console.log("Upstash Redis ready ✅");
};
