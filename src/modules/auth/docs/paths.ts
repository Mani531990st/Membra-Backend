import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { standardErrorResponses } from "@/docs/openapi";

import {
  ForgotPasswordSchema,
  LoginResponseSchema,
  LoginSchema,
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
    description: `Create a user profile, primary active email, and password credentials in one transaction. ${rateLimitNote}`,
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
        description: "User created",
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
    path: "/api/auth/login",
    tags: [AUTH_TAG],
    summary: "Log in",
    description: `Authenticate with an active email and password. Sets an HTTP-only session cookie on success. ${rateLimitNote}`,
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
    method: "post",
    path: "/api/auth/logout",
    tags: [AUTH_TAG],
    summary: "Log out",
    description:
      "Revokes the current server-side session (if any) and clears the session cookie.",
    security: [{ SessionCookie: [] }],
    responses: {
      200: {
        description: "Logged out",
        content: {
          "application/json": {
            schema: MessageResponseSchema,
          },
        },
      },
      ...standardErrorResponses([500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/auth/me",
    tags: [AUTH_TAG],
    summary: "Current user",
    description:
      "Returns the authenticated user for a valid HTTP-only session cookie. Responds with 401 if the session is missing, expired, or revoked.",
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
    description: `Always returns a generic success message. If an active account email exists, stores a hashed reset token and sends email after commit. ${rateLimitNote}`,
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
