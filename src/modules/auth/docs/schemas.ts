import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
  ForgotPasswordSchema,
  LoginResponseSchema,
  LoginSchema,
  MessageResponseSchema,
  ResetPasswordSchema,
  SignupResponseSchema,
  SignupSchema,
} from "../schemas/auth.schema";

export function registerAuthSchemas(registry: OpenAPIRegistry): void {
  registry.register("SignupRequest", SignupSchema);
  registry.register("LoginRequest", LoginSchema);
  registry.register("ForgotPasswordRequest", ForgotPasswordSchema);
  registry.register("ResetPasswordRequest", ResetPasswordSchema);
  registry.register("SignupResponse", SignupResponseSchema);
  registry.register("LoginResponse", LoginResponseSchema);
  registry.register("MessageResponse", MessageResponseSchema);
}
