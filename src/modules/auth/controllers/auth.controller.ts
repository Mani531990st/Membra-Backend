import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Put,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";

import { UnauthorizedError, ValidationError } from "@/shared/errors";
import { ZodValidationPipe } from "@/shared/validation/zod-pipe";

import { AuthSession } from "../decorators/auth-session.decorator";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import {
  CompleteProfileSchema,
  ForgotPasswordSchema,
  LoginSchema,
  LogoutSchema,
  ResetPasswordSchema,
  SignupSchema,
  type CompleteProfileInput,
  type ForgotPasswordInput,
  type LoginInput,
  type LogoutInput,
  type ResetPasswordInput,
  type SignupInput,
} from "../schemas/auth.schema";
import { MAX_AVATAR_BYTES } from "../services/avatar-image";
import {
  clearSessionCookie,
  setSessionCookie,
} from "../services/session-cookie";
import type { AuthSessionContext } from "../types/auth.types";
import { CompleteProfile } from "../use-cases/complete-profile";
import { ForgotPassword } from "../use-cases/forgot-password";
import { GetAvatars } from "../use-cases/get-avatars";
import { GetMe } from "../use-cases/get-me";
import { ListActiveSessions } from "../use-cases/list-active-sessions";
import { ListGenders } from "../use-cases/list-genders";
import { Login } from "../use-cases/login";
import { Logout } from "../use-cases/logout";
import { ResetPassword } from "../use-cases/reset-password";
import { Signup } from "../use-cases/signup";
import { UpdateAvatars } from "../use-cases/update-avatars";

type MulterFile = Express.Multer.File;

type AvatarUploadFields = {
  avatar?: MulterFile[];
};

const AUTH_ABUSE_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

function firstFile(files: MulterFile[] | undefined): MulterFile | undefined {
  return files?.[0];
}

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(Signup) private readonly signupUseCase: Signup,
    @Inject(CompleteProfile)
    private readonly completeProfileUseCase: CompleteProfile,
    @Inject(Login) private readonly loginUseCase: Login,
    @Inject(ListActiveSessions)
    private readonly listActiveSessionsUseCase: ListActiveSessions,
    @Inject(Logout) private readonly logoutUseCase: Logout,
    @Inject(GetMe) private readonly getMeUseCase: GetMe,
    @Inject(ForgotPassword)
    private readonly forgotPasswordUseCase: ForgotPassword,
    @Inject(ResetPassword)
    private readonly resetPasswordUseCase: ResetPassword,
    @Inject(ListGenders) private readonly listGendersUseCase: ListGenders,
    @Inject(UpdateAvatars)
    private readonly updateAvatarsUseCase: UpdateAvatars,
    @Inject(GetAvatars) private readonly getAvatarsUseCase: GetAvatars,
  ) {}

  @Post("signup")
  @HttpCode(201)
  @Throttle(AUTH_ABUSE_THROTTLE)
  async signup(
    @Body(new ZodValidationPipe(SignupSchema)) body: SignupInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = await this.signupUseCase.execute(body);
    setSessionCookie(res, session.rawToken, session.expiresAt);
    return { user };
  }

  @Post("complete-profile")
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  async completeProfile(
    @AuthSession() session: AuthSessionContext,
    @Body(new ZodValidationPipe(CompleteProfileSchema))
    body: CompleteProfileInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      return await this.completeProfileUseCase.execute(session.userId, body);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        clearSessionCookie(res);
      }
      throw error;
    }
  }

  @Post("login")
  @HttpCode(200)
  @Throttle(AUTH_ABUSE_THROTTLE)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = await this.loginUseCase.execute(body);
    setSessionCookie(res, session.rawToken, session.expiresAt);
    return { user };
  }

  @Get("genders")
  @HttpCode(200)
  async genders() {
    return this.listGendersUseCase.execute();
  }

  @Get("active-sessions")
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  async activeSessions(@AuthSession() session: AuthSessionContext) {
    return this.listActiveSessionsUseCase.execute(session);
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  async logout(
    @AuthSession() session: AuthSessionContext,
    @Body(new ZodValidationPipe(LogoutSchema)) body: LogoutInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.logoutUseCase.execute(session, body);
    if (result.clearCookie) {
      clearSessionCookie(res);
    }
    return { message: result.message };
  }

  @Get("me")
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  async me(
    @AuthSession() session: AuthSessionContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      return await this.getMeUseCase.execute(session.userId);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        clearSessionCookie(res);
      }
      throw error;
    }
  }

  @Put("avatars")
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: "avatar", maxCount: 1 }], {
      limits: { fileSize: MAX_AVATAR_BYTES },
    }),
  )
  async updateAvatars(
    @AuthSession() session: AuthSessionContext,
    @UploadedFiles() files: AvatarUploadFields,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const avatar = firstFile(files?.avatar);
      if (!avatar) {
        throw new ValidationError("avatar file is required");
      }
      return await this.updateAvatarsUseCase.execute(session.userId, {
        avatar: {
          buffer: avatar.buffer,
          mimetype: avatar.mimetype,
          size: avatar.size,
        },
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        clearSessionCookie(res);
      }
      throw error;
    }
  }

  @Get("avatars")
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  async getAvatars(
    @AuthSession() session: AuthSessionContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      return await this.getAvatarsUseCase.execute(session.userId);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        clearSessionCookie(res);
      }
      throw error;
    }
  }

  @Post("forgot-password")
  @HttpCode(200)
  @Throttle(AUTH_ABUSE_THROTTLE)
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordSchema))
    body: ForgotPasswordInput,
  ) {
    return this.forgotPasswordUseCase.execute(body);
  }

  @Post("reset-password")
  @HttpCode(200)
  @Throttle(AUTH_ABUSE_THROTTLE)
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) body: ResetPasswordInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.resetPasswordUseCase.execute(body);
    clearSessionCookie(res);
    return result;
  }
}
