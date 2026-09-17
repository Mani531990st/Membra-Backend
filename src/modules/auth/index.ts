export { AuthController } from "./controllers/auth.controller";
export { ReferenceController } from "./controllers/reference.controller";
export { UsersController } from "./controllers/users.controller";
export { AuthSession } from "./decorators/auth-session.decorator";
export { registerAuthDocs } from "./docs/paths";
export { SessionAuthGuard } from "./guards/session-auth.guard";
export {
  CompleteProfileSchema,
  ForgotPasswordSchema,
  LoginSchema,
  LogoutSchema,
  ResetPasswordSchema,
  SignupSchema,
} from "./schemas/auth.schema";
export type { AuthSessionContext } from "./types/auth.types";
