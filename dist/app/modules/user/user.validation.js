"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectAgentSchema = exports.updateUserProfileZodSchema = exports.updateUserZodSchema = exports.createUserZodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const user_interface_1 = require("./user.interface");
exports.createUserZodSchema = zod_1.default.object({
    name: zod_1.default
        .string()
        .min(2, { message: "Name too short. Minimum 2 characters required" })
        .max(50, { message: "Name too long. Maximum 50 characters allowed" }),
    email: zod_1.default.email({ message: "Invalid email format" }),
    password: zod_1.default
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
    })
        .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
    })
        .regex(/\d/, {
        message: "Password must contain at least one number",
    })
        .regex(/[@$!%*?&]/, {
        message: "Password must contain at least one special character (@$!%*?&)",
    }),
    phone: zod_1.default
        .string()
        .min(10, "Phone number too short")
        .max(15, "Phone number too long")
        .optional(),
    // .regex(/^(?:\+?88)?01[0-9]\d{8}$/, {
    //   message: "Invalid Bangladeshi phone number",
    // })
    role: zod_1.default.enum(Object.values(user_interface_1.Role)).optional(),
    address: zod_1.default
        .string()
        .min(5, { message: "Address must be at least 5 characters long" })
        .optional(),
});
exports.updateUserZodSchema = zod_1.default.object({
    name: zod_1.default
        .string()
        .min(2, { message: "Name too short. Minimum 2 characters required" })
        .max(50, { message: "Name too long. Maximum 50 characters allowed" })
        .optional(),
    phone: zod_1.default.string().optional(),
    role: zod_1.default.enum(Object.values(user_interface_1.Role)).optional(),
    isActive: zod_1.default.enum(Object.values(user_interface_1.IsActive)).optional(),
    isDeleted: zod_1.default.boolean().optional(),
    isAgentApproved: zod_1.default.boolean().optional(),
    isVerified: zod_1.default.boolean().optional(),
    address: zod_1.default
        .string()
        .min(5, { message: "Address must be at least 5 characters long" })
        .optional(),
});
exports.updateUserProfileZodSchema = zod_1.default.object({
    picture: zod_1.default.string().optional(),
});
exports.rejectAgentSchema = zod_1.default.object({
    reason: zod_1.default.string().optional(),
});
