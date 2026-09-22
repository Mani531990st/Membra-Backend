import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
  ActiveSessionsResponseSchema,
  ActivitiesResponseSchema,
  AvatarsResponseSchema,
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
  registry.register("MeResponse", MeResponseSchema);
  registry.register("ActiveSessionsResponse", ActiveSessionsResponseSchema);
  registry.register("GendersResponse", GendersResponseSchema);
  registry.register("ActivitiesResponse", ActivitiesResponseSchema);
  registry.register("RolesResponse", RolesResponseSchema);
  registry.register("MessageResponse", MessageResponseSchema);
  registry.register("AvatarsResponse", AvatarsResponseSchema);
}
