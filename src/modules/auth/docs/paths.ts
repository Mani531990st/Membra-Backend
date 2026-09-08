import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { standardErrorResponses } from "@/docs/openapi";

import {
  ActiveSessionsResponseSchema,
  CompleteProfileResponseSchema,
  CompleteProfileSchema,
  ForgotPasswordSchema,
  LoginResponseSchema,
  LoginSchema,
  LogoutSchema,
  MessageResponseSchema,
  ResetPasswordSchema,
  SignupResponseSchema,
  SignupSchema,
} from "../schemas/auth.schema";
import { registerAuthSchemas } from "./schemas";

const AUTH_TAG = "Authentication";

const rateLimitNote =
  "TODO: rate limiting is not implemented yet for this endpoint.";

export function registerAuthDocs(registry: OpenAPIRegistry): void {
  registerAuthSchemas(registry);

  registry.registerPath({
    method: "post",
    path: "/api/auth/signup",
    tags: [AUTH_TAG],
    summary: "Sign up",
    description: `Create a user with email and password, dual-write credentials and user_emails, and set an HTTP-only session cookie. Profile fields remain null until complete-profile. ${rateLimitNote}`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: SignupSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "User created; session cookie set",
        content: {
          "application/json": {
            schema: SignupResponseSchema,
          },
        },
      },
      ...standardErrorResponses([400, 409, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/complete-profile",
    tags: [AUTH_TAG],
    summary: "Complete profile",
    description: `Update the authenticated user's profile fields. Requires a valid session cookie from signup or login. Request \`gender\` is the numeric ID from \`app.genders\` (run \`npm run db:seed:genders\` first). ${rateLimitNote}`,
    security: [{ SessionCookie: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: CompleteProfileSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Profile updated",
        content: {
          "application/json": {
            schema: CompleteProfileResponseSchema,
          },
        },
      },
      ...standardErrorResponses([400, 401, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/login",
    tags: [AUTH_TAG],
    summary: "Log in",
    description: `Authenticate with credentials email and password. Sets an HTTP-only session cookie on success. Optional \`rememberMe\` (default false) sets session and cookie expiry to 7 days when true, or 24 hours when false/omitted. Each user may have at most 5 active sessions; creating another revokes the oldest active session first. ${rateLimitNote}`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: LoginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Authenticated; session cookie set",
        content: {
          "application/json": {
            schema: LoginResponseSchema,
          },
        },
      },
      ...standardErrorResponses([400, 401, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/auth/active-sessions",
    tags: [AUTH_TAG],
    summary: "List active sessions",
    description:
      "Returns all non-expired, non-revoked sessions for the authenticated user. Marks the session matching the current membra_session cookie with isCurrent. Does not expose session tokens or token hashes.",
    security: [{ SessionCookie: [] }],
    responses: {
      200: {
        description: "Active sessions for the authenticated user",
        content: {
          "application/json": {
            schema: ActiveSessionsResponseSchema,
          },
        },
      },
      ...standardErrorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/logout",
    tags: [AUTH_TAG],
    summary: "Log out a session",
    description:
      "Revokes the selected active session belonging to the authenticated user. If the selected session is the current cookie session, also clears the membra_session cookie. Logging out another of the user's sessions leaves the cookie unchanged.",
    security: [{ SessionCookie: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: LogoutSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Session revoked",
        content: {
          "application/json": {
            schema: MessageResponseSchema,
          },
        },
      },
      ...standardErrorResponses([400, 401, 404, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/auth/me",
    tags: [AUTH_TAG],
    summary: "Current user",
    description:
      "Returns the authenticated user for a valid HTTP-only session cookie. Responds with 401 if the session is missing, expired, or revoked. Profile fields may be null until complete-profile.",
    security: [{ SessionCookie: [] }],
    responses: {
      200: {
        description: "Authenticated user",
        content: {
          "application/json": {
            schema: LoginResponseSchema,
          },
        },
      },
      ...standardErrorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/forgot-password",
    tags: [AUTH_TAG],
    summary: "Forgot password",
    description: `Always returns a generic success message. If a credentials email exists, stores a hashed reset token and sends email after commit. ${rateLimitNote}`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: ForgotPasswordSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Generic acknowledgment",
        content: {
          "application/json": {
            schema: MessageResponseSchema,
          },
        },
      },
      ...standardErrorResponses([400, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/reset-password",
    tags: [AUTH_TAG],
    summary: "Reset password",
    description: `Consumes a single-use reset token, updates the password hash, and revokes all sessions atomically. ${rateLimitNote}`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: ResetPasswordSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Password reset",
        content: {
          "application/json": {
            schema: MessageResponseSchema,
          },
        },
      },
      ...standardErrorResponses([400, 500]),
    },
  });
}
