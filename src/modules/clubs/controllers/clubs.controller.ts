import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";

import { ValidationError } from "@/shared/errors";
import { MAX_AVATAR_BYTES } from "@/shared/images/avatar-image";
import { ZodValidationPipe } from "@/shared/validation/zod-pipe";

import { AuthSession } from "@/modules/auth/decorators/auth-session.decorator";
import { SessionAuthGuard } from "@/modules/auth/guards/session-auth.guard";
import type { AuthSessionContext } from "@/modules/auth/types/auth.types";

import {
  ClubAddressBodySchema,
  ClubAddressIdParamSchema,
  ClubIdParamSchema,
  CreateClubSchema,
  UpdateClubAddressSchema,
  UpdateClubSchema,
  type ClubAddressBody,
  type UpdateClubAddressInput,
  type CreateClubInput,
  type UpdateClubInput,
} from "../schemas/clubs.schema";
import {
  AddClubAddress,
  MakeClubAddressPrimary,
  UpdateClubAddress,
} from "../use-cases/club-addresses";
import { GetClubAvatars, UpdateClubAvatars } from "../use-cases/club-avatars";
import { CreateClub } from "../use-cases/create-club";
import { GetClub } from "../use-cases/get-club";
import { ListActivities, ListLanguages } from "../use-cases/list-catalogs";
import { UpdateClub } from "../use-cases/update-club";

type MulterFile = Express.Multer.File;

type AvatarUploadFields = {
  avatar?: MulterFile[];
};

@Controller("clubs")
@UseGuards(SessionAuthGuard)
export class ClubsController {
  constructor(
    @Inject(CreateClub) private readonly createClub: CreateClub,
    @Inject(GetClub) private readonly getClub: GetClub,
    @Inject(UpdateClub) private readonly updateClub: UpdateClub,
    @Inject(AddClubAddress) private readonly addAddress: AddClubAddress,
    @Inject(UpdateClubAddress)
    private readonly updateAddress: UpdateClubAddress,
    @Inject(MakeClubAddressPrimary)
    private readonly makePrimary: MakeClubAddressPrimary,
    @Inject(UpdateClubAvatars)
    private readonly updateAvatars: UpdateClubAvatars,
    @Inject(GetClubAvatars) private readonly getAvatars: GetClubAvatars,
    @Inject(ListActivities) private readonly listActivities: ListActivities,
    @Inject(ListLanguages) private readonly listLanguages: ListLanguages,
  ) {}

  @Get("activities")
  async activities() {
    return this.listActivities.execute();
  }

  @Get("languages")
  async languages() {
    return this.listLanguages.execute();
  }

  @Post()
  @HttpCode(201)
  async create(
    @AuthSession() session: AuthSessionContext,
    @Body(new ZodValidationPipe(CreateClubSchema)) body: CreateClubInput,
  ) {
    return this.createClub.execute(session.userId, body);
  }

  @Get(":clubId")
  async get(
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
  ) {
    return this.getClub.execute(params.clubId);
  }

  @Patch(":clubId")
  async update(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
    @Body(new ZodValidationPipe(UpdateClubSchema)) body: UpdateClubInput,
  ) {
    return this.updateClub.execute(params.clubId, session.userId, body);
  }

  @Post(":clubId/addresses")
  @HttpCode(201)
  async addClubAddress(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
    @Body(new ZodValidationPipe(ClubAddressBodySchema)) body: ClubAddressBody,
  ) {
    return this.addAddress.execute(params.clubId, session.userId, body);
  }

  @Patch(":clubId/addresses/:addressId")
  async patchClubAddress(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubAddressIdParamSchema))
    params: { clubId: number; addressId: number },
    @Body(new ZodValidationPipe(UpdateClubAddressSchema))
    body: UpdateClubAddressInput,
  ) {
    return this.updateAddress.execute(
      params.clubId,
      params.addressId,
      session.userId,
      body,
    );
  }

  @Post(":clubId/addresses/:addressId/primary")
  @HttpCode(200)
  async makeClubAddressPrimary(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubAddressIdParamSchema))
    params: { clubId: number; addressId: number },
  ) {
    return this.makePrimary.execute(
      params.clubId,
      params.addressId,
      session.userId,
    );
  }

  @Put(":clubId/avatars")
  @UseInterceptors(
    FileFieldsInterceptor([{ name: "avatar", maxCount: 1 }], {
      limits: { fileSize: MAX_AVATAR_BYTES },
    }),
  )
  async putAvatars(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
    @UploadedFiles() files: AvatarUploadFields,
  ) {
    const file = files?.avatar?.[0];
    if (!file) {
      throw new ValidationError("avatar file is required");
    }
    return this.updateAvatars.execute(params.clubId, session.userId, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  @Get(":clubId/avatars")
  async getClubAvatars(
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
  ) {
    return this.getAvatars.execute(params.clubId);
  }
}
