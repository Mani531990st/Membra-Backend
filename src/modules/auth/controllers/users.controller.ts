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
import type { Response } from "express";

import { UnauthorizedError, ValidationError } from "@/shared/errors";
import { ZodValidationPipe } from "@/shared/validation/zod-pipe";

import { AuthSession } from "../decorators/auth-session.decorator";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import {
  CompleteProfileSchema,
  type CompleteProfileInput,
} from "../schemas/auth.schema";
import { MAX_AVATAR_BYTES } from "../services/avatar-image";
import { clearSessionCookie } from "../services/session-cookie";
import type { AuthSessionContext } from "../types/auth.types";
import { CompleteProfile } from "../use-cases/complete-profile";
import { GetAvatars } from "../use-cases/get-avatars";
import { GetMe } from "../use-cases/get-me";
import { UpdateAvatars } from "../use-cases/update-avatars";

type MulterFile = Express.Multer.File;

type AvatarUploadFields = {
  avatar?: MulterFile[];
};

function firstFile(files: MulterFile[] | undefined): MulterFile | undefined {
  return files?.[0];
}

@Controller("users")
export class UsersController {
  constructor(
    @Inject(CompleteProfile)
    private readonly completeProfileUseCase: CompleteProfile,
    @Inject(GetMe) private readonly getMeUseCase: GetMe,
    @Inject(UpdateAvatars)
    private readonly updateAvatarsUseCase: UpdateAvatars,
    @Inject(GetAvatars) private readonly getAvatarsUseCase: GetAvatars,
  ) {}

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
}
