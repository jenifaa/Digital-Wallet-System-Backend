import z from "zod";
import { IsActive, Role } from "./user.interface";

export const createUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name too short. Minimum 2 characters required" })
    .max(50, { message: "Name too long. Maximum 50 characters allowed" }),

  email: z.email({ message: "Invalid email format" }),

  password: z
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

  phone: z.string(),
  // .regex(/^(?:\+?88)?01[0-9]\d{8}$/, {
  //   message: "Invalid Bangladeshi phone number",
  // })
  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters long" })
    .optional(),
});

export const updateUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name too short. Minimum 2 characters required" })
    .max(50, { message: "Name too long. Maximum 50 characters allowed" })
    .optional(),

  phone: z.string().optional(),

  role: z.enum(Object.values(Role) as [string]).optional(),
  isActive: z.enum(Object.values(IsActive) as [string]).optional(),
  isDeleted: z.boolean().optional(),
  isVerified: z.boolean().optional(),

  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters long" })
    .optional(),
});
