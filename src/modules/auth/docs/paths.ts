import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { standardErrorResponses } from "@/docs/openapi";
import { z } from "@/shared/validation/zod";

import {
  ActiveSessionsResponseSchema,
  ActivitiesResponseSchema,
  AvatarsResponseSchema,
  ColorsResponseSchema,
  CompleteProfileResponseSchema,
  CompleteProfileSchema,
  ForgotPasswordSchema,
  GendersResponseSchema,
  LoginResponseSchema,
  LoginSchema,
  LogoutSchema,
  MeResponseSchema,
  MessageResponseSchema,
  ResetPasswordSchema,
  RolesResponseSchema,
  SignupResponseSchema,
  SignupSchema,
} from "../schemas/auth.schema";
import { registerAuthSchemas } from "./schemas";

const AUTH_TAG = "Authentication";
const USERS_TAG = "Users";
const REFERENCE_TAG = "Reference";

const avatarBinaryField = z.string().openapi({
  type: "string",
  format: "binary",
  description:
    "Single profile image as File or Blob (JPEG, PNG, HEIC, HEIF, WebP, or AVIF, max 8 MB). MIME may be omitted or application/octet-stream; format is detected from content. Server creates 384×384, 96×96, and 32×32 AVIF variants.",
});

const UploadAvatarsRequestSchema = z
  .object({
    avatar: avatarBinaryField,
  })
  .openapi("UploadAvatarsRequest");

export function registerAuthDocs(registry: OpenAPIRegistry): void {
  registerAuthSchemas(registry);
  registry.register("UploadAvatarsRequest", UploadAvatarsRequestSchema);

  registry.registerPath({
    method: "post",
    path: "/api/auth/signup",
    tags: [AUTH_TAG],
    summary: "Sign up",
    description:
      "Create a user with email and password. Login identity is user_credentials.email; user_emails is a contact copy written in the same transaction. Profile fields stay null until complete-profile. Sets an HTTP-only session cookie (24 hours). Rate limited.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": { schema: SignupSchema },
        },
      },
    },
    responses: {
      201: {
        description: "User created; session cookie set",
        content: { "application/json": { schema: SignupResponseSchema } },
      },
      ...standardErrorResponses([400, 409, 429, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/login",
    tags: [AUTH_TAG],
    summary: "Log in",
    description:
      "Authenticate with credentials email and password. Sets an HTTP-only session cookie. Optional rememberMe (default false) sets expiry to 7 days when true, or 24 hours when false. At most 5 active sessions; creating another revokes the oldest. Rate limited.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": { schema: LoginSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Authenticated; session cookie set",
        content: { "application/json": { schema: LoginResponseSchema } },
      },
      ...standardErrorResponses([400, 401, 429, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/auth/active-sessions",
    tags: [AUTH_TAG],
    summary: "List active sessions",
    description:
      "Returns non-expired, non-revoked sessions for the authenticated user. Marks the current cookie session with isCurrent. Does not expose tokens.",
    security: [{ SessionCookie: [] }],
    responses: {
      200: {
        description: "Active sessions",
        content: {
          "application/json": { schema: ActiveSessionsResponseSchema },
        },
      },
      ...standardErrorResponses([401, 429, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/logout",
    tags: [AUTH_TAG],
    summary: "Log out a session",
    description:
      "Revokes a session belonging to the authenticated user. `sessionId` is optional — omit it (or send `{}`) to log out the current cookie session and clear the cookie. Passing another session's id revokes that session only and leaves the cookie unchanged.",
    security: [{ SessionCookie: [] }],
    request: {
      body: {
        required: false,
        content: {
          "application/json": { schema: LogoutSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Session revoked",
        content: { "application/json": { schema: MessageResponseSchema } },
      },
      ...standardErrorResponses([400, 401, 404, 429, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/forgot-password",
    tags: [AUTH_TAG],
    summary: "Forgot password",
    description:
      "Always returns a generic success message. If the credentials email exists, stores a hashed reset token and sends mail after commit. Mailer failures are logged and still return 200. Rate limited.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": { schema: ForgotPasswordSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Generic acknowledgment",
        content: { "application/json": { schema: MessageResponseSchema } },
      },
      ...standardErrorResponses([400, 429, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/reset-password",
    tags: [AUTH_TAG],
    summary: "Reset password",
    description:
      "Atomically consumes a still-valid reset token, updates the password hash, and revokes all sessions. Clears the current cookie. Rate limited.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": { schema: ResetPasswordSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Password reset",
        content: { "application/json": { schema: MessageResponseSchema } },
      },
      ...standardErrorResponses([400, 429, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/users/me",
    tags: [USERS_TAG],
    summary: "Current user",
    description:
      "Returns the authenticated user for a valid session cookie, plus signed avatar URLs, primary contact email, and primary phone. profileComplete is true when name, dob, genderId, and preferred language are set.",
    security: [{ SessionCookie: [] }],
    responses: {
      200: {
        description: "Authenticated user profile",
        content: { "application/json": { schema: MeResponseSchema } },
      },
      ...standardErrorResponses([401, 429, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/users/complete-profile",
    tags: [USERS_TAG],
    summary: "Complete profile",
    description:
      "Update the authenticated user's profile. `genderId` is the numeric id from GET /api/reference/genders. Requires a valid session cookie.",
    security: [{ SessionCookie: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": { schema: CompleteProfileSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Profile updated",
        content: {
          "application/json": { schema: CompleteProfileResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 429, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/users/avatars",
    tags: [USERS_TAG],
    summary: "Upload or update avatar",
    description:
      "Upload a single profile image for the authenticated user (multipart field `avatar`: File or Blob — JPEG, PNG, HEIC, HEIF, WebP, or AVIF). MIME may be omitted or `application/octet-stream`; content is sniffed. The API creates three square AVIF variants — avatar1 384×384, avatar2 96×96, avatar3 32×32 — stores them in Scaleway Object Storage, and returns signed GET URLs (1 hour).",
    security: [{ SessionCookie: [] }],
    request: {
      body: {
        required: true,
        content: {
          "multipart/form-data": { schema: UploadAvatarsRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Current avatar signed URLs after update",
        content: { "application/json": { schema: AvatarsResponseSchema } },
      },
      ...standardErrorResponses([400, 401, 429, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/users/avatars",
    tags: [USERS_TAG],
    summary: "Get avatars",
    description:
      "Returns signed GET URLs (1 hour) for the authenticated user's avatar variants: avatar1 (384×384), avatar2 (96×96), avatar3 (32×32). Unset slots are null.",
    security: [{ SessionCookie: [] }],
    responses: {
      200: {
        description: "Avatar signed URLs",
        content: { "application/json": { schema: AvatarsResponseSchema } },
      },
      ...standardErrorResponses([401, 429, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/reference/genders",
    tags: [REFERENCE_TAG],
    summary: "List genders",
    description:
      "Active reference rows from app.genders (`id`, `gender`, `genderShort`). Use `id` as `genderId` on complete-profile.",
    responses: {
      200: {
        description: "Gender reference data",
        content: { "application/json": { schema: GendersResponseSchema } },
      },
      ...standardErrorResponses([500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/reference/activities",
    tags: [REFERENCE_TAG],
    summary: "List activities",
    description:
      "Active reference rows from app.activities (`id`, `activity`). Use `id` as activityIds when creating/updating clubs.",
    responses: {
      200: {
        description: "Activity reference data",
        content: { "application/json": { schema: ActivitiesResponseSchema } },
      },
      ...standardErrorResponses([500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/reference/roles",
    tags: [REFERENCE_TAG],
    summary: "List roles",
    description:
      "Active reference rows from app.roles (`id`, `role`, `roleShort`).",
    responses: {
      200: {
        description: "Role reference data",
        content: { "application/json": { schema: RolesResponseSchema } },
      },
      ...standardErrorResponses([500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/reference/colors",
    tags: [REFERENCE_TAG],
    summary: "List colors",
    description:
      "Active reference rows from app.colors (`id`, `color`, `hex`, `isPublic`, `isTextBlack`). Includes non-public colors; filter client-side with `isPublic` when needed.",
    responses: {
      200: {
        description: "Color reference data",
        content: { "application/json": { schema: ColorsResponseSchema } },
      },
      ...standardErrorResponses([500]),
    },
  });
}
