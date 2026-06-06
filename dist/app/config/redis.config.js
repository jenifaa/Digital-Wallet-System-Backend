"use strict";
// import { createClient } from "redis";
// import { envVars } from "./env";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redisClient = void 0;
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
const redis_1 = require("@upstash/redis");
const env_1 = require("./env");
exports.redisClient = new redis_1.Redis({
    url: env_1.envVars.UPSTASH_REDIS_REST_URL,
    token: env_1.envVars.UPSTASH_REDIS_REST_TOKEN,
});
// No connectRedis needed — Upstash uses HTTP, no persistent connection
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Upstash Redis ready ✅");
});
exports.connectRedis = connectRedis;
