"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./app/config/env");
const app_1 = __importDefault(require("./app"));
const seedSuperAdmin_1 = require("./app/utils/seedSuperAdmin");
const redis_config_1 = require("./app/config/redis.config");
let server;
let isConnected = false;
const initializeContext = () => __awaiter(void 0, void 0, void 0, function* () {
    if (isConnected)
        return;
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            yield mongoose_1.default.connect(env_1.envVars.DB_URL);
            console.log("Connected to db");
        }
        yield (0, redis_config_1.connectRedis)();
        yield (0, seedSuperAdmin_1.seedSuperAdmin)();
        isConnected = true;
    }
    catch (error) {
        console.log(error);
    }
});
// 1. Conditionally Start Server locally (Skips this block on Vercel)
if (!process.env.VERCEL) {
    initializeContext().then(() => {
        server = app_1.default.listen(env_1.envVars.PORT, () => {
            console.log(`Server is listening at ${env_1.envVars.PORT}`);
        });
    });
}
// Global error handlers...
process.on("SIGTERM", () => {
    console.log("SIGTERM detected");
    if (server) {
        server.close(() => process.exit(1));
    }
    else {
        process.exit(1);
    }
});
process.on("unhandledRejection", () => {
    console.log("UnhandledRejection detected");
    if (server) {
        server.close(() => process.exit(1));
    }
    else {
        process.exit(1);
    }
});
process.on("uncaughtException", () => {
    console.log("uncaughtException detected");
    if (server) {
        server.close(() => process.exit(1));
    }
    else {
        process.exit(1);
    }
});
exports.default = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield initializeContext();
    return (0, app_1.default)(req, res);
});
