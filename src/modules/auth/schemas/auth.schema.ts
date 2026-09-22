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

export const preferredLangSchema = z
  .string()
  .trim()
  .min(1)
  .max(15)
  .openapi({
    example: "en-US",
    description: "Language id from GET /api/clubs/languages",
  });

export const SignupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .openapi("SignupRequest");

export const CompleteProfileSchema = z
  .object({
    firstname: z.string().trim().min(1).max(200).openapi({ example: "Ada" }),
    surname: z.string().trim().min(1).max(200).openapi({ example: "Lovelace" }),
    nickname: z.string().trim().min(1).max(200).openapi({ example: "Ada" }),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be YYYY-MM-DD")
      .openapi({ example: "1990-01-15" }),
    genderId: z.number().int().positive().openapi({
      example: 1,
      description: "ID from GET /api/reference/genders",
    }),
    preferredLang: preferredLangSchema,
  })
  .openapi("CompleteProfileRequest");

export const LoginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    rememberMe: z.boolean().optional().default(false).openapi({
      description:
        "If true, session lasts 7 days; otherwise 24 hours. Defaults to false when omitted.",
      example: false,
    }),
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

export const LogoutSchema = z
  .object({
    sessionId: z.string().uuid().optional().openapi({
      description:
        "UUID of an active session to revoke. Omit (or send `{}`) to log out the current cookie session.",
      example: "01936a2f-8c4a-7b2e-9f1d-4a5b6c7d8e9f",
    }),
  })
  .openapi("LogoutRequest");

export const ActiveSessionSchema = z
  .object({
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    isCurrent: z.boolean().openapi({
      description: "True when this session matches the caller's membra_session cookie",
    }),
  })
  .openapi("ActiveSession");

export const ActiveSessionsResponseSchema = z
  .object({
    sessions: z.array(ActiveSessionSchema),
  })
  .openapi("ActiveSessionsResponse");

export const GenderRowSchema = z
  .object({
    id: z.number().int(),
    gender: genderEnumSchema,
  })
  .openapi("GenderRow");

export const GendersResponseSchema = z
  .object({
    genders: z.array(GenderRowSchema),
  })
  .openapi("GendersResponse");

export const SafeUserSchema = z
  .object({
    uuid: z.string().uuid(),
    email: z.string().email(),
    firstname: z.string().nullable(),
    surname: z.string().nullable(),
    nickname: z.string().nullable(),
    dob: z.string().nullable(),
    genderId: z.number().int().nullable(),
    preferredLang: z.string().nullable(),
    profileComplete: z.boolean(),
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

export const CompleteProfileResponseSchema = z
  .object({
    user: SafeUserSchema,
  })
  .openapi("CompleteProfileResponse");

export const MessageResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi("MessageResponse");

export const AvatarsResponseSchema = z
  .object({
    avatar1: z.string().url().nullable().openapi({
      description:
        "Signed GET URL for the 384×384 AVIF (expires in 1 hour), or null when unset",
    }),
    avatar2: z.string().url().nullable().openapi({
      description:
        "Signed GET URL for the 96×96 AVIF (expires in 1 hour), or null when unset",
    }),
    avatar3: z.string().url().nullable().openapi({
      description:
        "Signed GET URL for the 32×32 AVIF (expires in 1 hour), or null when unset",
    }),
  })
  .openapi("AvatarsResponse");

export const PrimaryPhoneSchema = z
  .object({
    phoneCountryCode: z.number().int().nullable(),
    phoneNumber: z.string().nullable(),
  })
  .openapi("PrimaryPhone");

export const MeResponseSchema = z
  .object({
    user: SafeUserSchema,
    avatars: AvatarsResponseSchema,
    primaryEmail: z.string().email().nullable().openapi({
      description:
        "Primary active contact email from user_emails, or null when unset",
    }),
    primaryPhone: PrimaryPhoneSchema.nullable().openapi({
      description:
        "Primary active phone from user_phone_numbers, or null when unset",
    }),
  })
  .openapi("MeResponse");

export type SignupInput = z.infer<typeof SignupSchema>;
export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
export type SafeUser = z.infer<typeof SafeUserSchema>;
export type ActiveSession = z.infer<typeof ActiveSessionSchema>;
export type AvatarsResponse = z.infer<typeof AvatarsResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type PrimaryPhone = z.infer<typeof PrimaryPhoneSchema>;
