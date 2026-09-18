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

import { AuthSession, SessionAuthGuard } from "@/modules/auth";
import type { AuthSessionContext } from "@/modules/auth";

import {
  ClubAddressBodySchema,
  ClubAddressIdParamSchema,
  ClubIdParamSchema,
  ClubLocationIdParamSchema,
  CreateClubSchema,
  CreateLocationSchema,
  UpdateClubAddressSchema,
  UpdateClubSchema,
  UpdateLocationSchema,
  type ClubAddressBody,
  type CreateLocationInput,
  type UpdateClubAddressInput,
  type UpdateClubInput,
  type UpdateLocationInput,
} from "../schemas/clubs.schema";
import {
  AddClubAddress,
  MakeClubAddressPrimary,
  UpdateClubAddress,
} from "../use-cases/club-addresses";
import { GetClubAvatars, UpdateClubAvatars } from "../use-cases/club-avatars";
import { CreateClub } from "../use-cases/create-club";
import { GetClub } from "../use-cases/get-club";
import { ListAdminClubs } from "../use-cases/list-admin-clubs";
import { ListActivities, ListLanguages } from "../use-cases/list-catalogs";
import {
  CreateLocation,
  GetLocation,
  ListLocations,
  UpdateLocation,
} from "../use-cases/locations";
import { UpdateClub } from "../use-cases/update-club";
import { parseCreateClubMultipartBody } from "../lib/parse-create-club-multipart";

type MulterFile = Express.Multer.File;

type AvatarUploadFields = {
  avatar?: MulterFile[];
};

@Controller("clubs")
@UseGuards(SessionAuthGuard)
export class ClubsController {
  constructor(
    @Inject(CreateClub) private readonly createClub: CreateClub,
    @Inject(ListAdminClubs) private readonly listAdminClubs: ListAdminClubs,
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
    @Inject(CreateLocation) private readonly createLocation: CreateLocation,
    @Inject(UpdateLocation) private readonly updateLocation: UpdateLocation,
    @Inject(GetLocation) private readonly getLocation: GetLocation,
    @Inject(ListLocations) private readonly listLocations: ListLocations,
  ) {}

  @Get("activities")
  async activities() {
    return this.listActivities.execute();
  }

  @Get("languages")
  async languages() {
    return this.listLanguages.execute();
  }

  @Get()
  async listMine(@AuthSession() session: AuthSessionContext) {
    return this.listAdminClubs.execute(session.userId);
  }

  @Post()
  @HttpCode(201)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: "avatar", maxCount: 1 }], {
      limits: { fileSize: MAX_AVATAR_BYTES },
    }),
  )
  async create(
    @AuthSession() session: AuthSessionContext,
    @Body() rawBody: Record<string, unknown>,
    @UploadedFiles() files: AvatarUploadFields,
  ) {
    const parsed = parseCreateClubMultipartBody(rawBody ?? {});
    const body = new ZodValidationPipe(CreateClubSchema).transform(parsed);

    const file = files?.avatar?.[0];
    const avatar = file
      ? {
          buffer: file.buffer,
          mimetype: file.mimetype,
          size: file.size,
        }
      : undefined;

    return this.createClub.execute(session.userId, body, avatar);
  }

  @Get(":clubId")
  async get(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
  ) {
    return this.getClub.execute(params.clubId, session.userId);
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

  @Get(":clubId/locations")
  async listClubLocations(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
  ) {
    return this.listLocations.execute(params.clubId, session.userId);
  }

  @Post(":clubId/locations")
  @HttpCode(201)
  async addClubLocation(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
    @Body(new ZodValidationPipe(CreateLocationSchema))
    body: CreateLocationInput,
  ) {
    return this.createLocation.execute(params.clubId, session.userId, body);
  }

  @Get(":clubId/locations/:locationId")
  async getClubLocation(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubLocationIdParamSchema))
    params: { clubId: number; locationId: number },
  ) {
    return this.getLocation.execute(
      params.clubId,
      params.locationId,
      session.userId,
    );
  }

  @Patch(":clubId/locations/:locationId")
  async patchClubLocation(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubLocationIdParamSchema))
    params: { clubId: number; locationId: number },
    @Body(new ZodValidationPipe(UpdateLocationSchema))
    body: UpdateLocationInput,
  ) {
    return this.updateLocation.execute(
      params.clubId,
      params.locationId,
      session.userId,
      body,
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
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
  ) {
    return this.getAvatars.execute(params.clubId, session.userId);
  }
}
