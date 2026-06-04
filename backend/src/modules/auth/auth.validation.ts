import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل")
  .max(128)
  .regex(/[A-Za-z]/, "يجب أن تحتوي كلمة المرور على حرف واحد على الأقل")
  .regex(/[0-9]/, "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل");

export const loginBodySchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    // Deprecated transition field kept for one release.
    email: z.string().trim().min(1).optional(),
    password: z.string().min(8).max(128)
  })
  .refine((value) => Boolean(value.identifier || value.email), {
    message: "حقل البريد الإلكتروني أو رقم الهاتف مطلوب"
  })
  .strict();

export const refreshBodySchema = z
  .object({
    refreshToken: z.string().min(20).max(2000).optional()
  })
  .strict();

export const forgotPasswordBodySchema = z
  .object({
    identifier: z.string().trim().min(1)
  })
  .strict();

export const resetPasswordBodySchema = z
  .object({
    token: z.string().trim().min(20).max(4000),
    newPassword: strongPasswordSchema
  })
  .strict();

export const checkUserBodySchema = z
  .object({
    identifier: z.string().trim().min(1)
  })
  .strict();

export const setupPasswordBodySchema = z
  .object({
    identifier: z.string().trim().min(1),
    newPassword: strongPasswordSchema
  })
  .strict();

export const validateActivationTokenBodySchema = z
  .object({
    token: z.string().trim().min(20).max(4000)
  })
  .strict();

export const activateAccountBodySchema = z
  .object({
    token: z.string().trim().min(20).max(4000),
    newPassword: strongPasswordSchema
  })
  .strict();
