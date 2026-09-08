import { z } from "@/shared/validation/zod";

export const genderEnumSchema = z
  .enum(["male", "female", "others"])
  .openapi({ example: "male" });

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .openapi({
    description:
      "Password policy: minimum 8 characters, maximum 128 characters. No required character classes.",
    example: "correct-horse-battery",
    minLength: 8,
    maxLength: 128,
  });

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(254)
  .transform((value) => value.toLowerCase())
  .openapi({ example: "user@example.com" });

export const SignupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    firstname: z.string().trim().min(1).max(200).openapi({ example: "Ada" }),
    surname: z.string().trim().min(1).max(200).openapi({ example: "Lovelace" }),
    nickname: z.string().trim().min(1).max(200).openapi({ example: "Ada" }),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be YYYY-MM-DD")
      .openapi({ example: "1990-01-15" }),
    gender: genderEnumSchema,
    preferred_lang: z
      .string()
      .trim()
      .min(2)
      .max(15)
      .openapi({ example: "en" }),
  })
  .openapi("SignupRequest");

export const LoginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .openapi("LoginRequest");

export const ForgotPasswordSchema = z
  .object({
    email: emailSchema,
  })
  .openapi("ForgotPasswordRequest");

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1).max(512).openapi({
      description: "Opaque password-reset token from the reset email link",
    }),
    password: passwordSchema,
  })
  .openapi("ResetPasswordRequest");

export const SafeUserSchema = z
  .object({
    uuid: z.string().uuid(),
    email: z.string().email(),
    firstname: z.string(),
    surname: z.string(),
    nickname: z.string(),
    dob: z.string(),
    gender: genderEnumSchema,
    preferred_lang: z.string(),
  })
  .openapi("SafeUser");

export const SignupResponseSchema = z
  .object({
    user: SafeUserSchema,
  })
  .openapi("SignupResponse");

export const LoginResponseSchema = z
  .object({
    user: SafeUserSchema,
  })
  .openapi("LoginResponse");

export const MessageResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi("MessageResponse");

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type SafeUser = z.infer<typeof SafeUserSchema>;
