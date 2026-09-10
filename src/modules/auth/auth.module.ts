import { Module } from "@nestjs/common";

import {
  createScalewayObjectStorage,
  SCALEWAY_OBJECT_STORAGE,
} from "@/shared/storage/scaleway-object-storage";

import { AuthController } from "./controllers/auth.controller";
import { SessionAuthGuard } from "./guards/session-auth.guard";
import { AuthRepository } from "./repositories/auth.repository";
import { SessionRepository } from "./repositories/session.repository";
import { UserAvatarsRepository } from "./repositories/user-avatars.repository";
import { PasswordHasher } from "./services/password-hasher";
import {
  createPasswordResetMailer,
  PASSWORD_RESET_MAILER,
} from "./services/password-reset-mailer";
import { SessionIssuer } from "./services/session-issuer";
import { CompleteProfile } from "./use-cases/complete-profile";
import { ForgotPassword } from "./use-cases/forgot-password";
import { GetAvatars } from "./use-cases/get-avatars";
import { GetMe } from "./use-cases/get-me";
import { ListActiveSessions } from "./use-cases/list-active-sessions";
import { ListGenders } from "./use-cases/list-genders";
import { Login } from "./use-cases/login";
import { Logout } from "./use-cases/logout";
import { ResetPassword } from "./use-cases/reset-password";
import { Signup } from "./use-cases/signup";
import { UpdateAvatars } from "./use-cases/update-avatars";

@Module({
  controllers: [AuthController],
  providers: [
    AuthRepository,
    SessionRepository,
    UserAvatarsRepository,
    PasswordHasher,
    SessionIssuer,
    SessionAuthGuard,
    {
      provide: PASSWORD_RESET_MAILER,
      useFactory: createPasswordResetMailer,
    },
    {
      provide: SCALEWAY_OBJECT_STORAGE,
      useFactory: createScalewayObjectStorage,
    },
    Signup,
    CompleteProfile,
    Login,
    ListActiveSessions,
    Logout,
    GetMe,
    ForgotPassword,
    ResetPassword,
    ListGenders,
    UpdateAvatars,
    GetAvatars,
  ],
})
export class AuthModule {}
