import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
  ActiveSessionsResponseSchema,
  CompleteProfileResponseSchema,
  CompleteProfileSchema,
  ForgotPasswordSchema,
  GendersResponseSchema,
  LoginResponseSchema,
  LoginSchema,
  LogoutSchema,
  MessageResponseSchema,
  ResetPasswordSchema,
  SignupResponseSchema,
  SignupSchema,
} from "../schemas/auth.schema";

export function registerAuthSchemas(registry: OpenAPIRegistry): void {
  registry.register("SignupRequest", SignupSchema);
  registry.register("CompleteProfileRequest", CompleteProfileSchema);
  registry.register("LoginRequest", LoginSchema);
  registry.register("LogoutRequest", LogoutSchema);
  registry.register("ForgotPasswordRequest", ForgotPasswordSchema);
  registry.register("ResetPasswordRequest", ResetPasswordSchema);
  registry.register("SignupResponse", SignupResponseSchema);
  registry.register("CompleteProfileResponse", CompleteProfileResponseSchema);
  registry.register("LoginResponse", LoginResponseSchema);
  registry.register("ActiveSessionsResponse", ActiveSessionsResponseSchema);
  registry.register("GendersResponse", GendersResponseSchema);
  registry.register("MessageResponse", MessageResponseSchema);
}
