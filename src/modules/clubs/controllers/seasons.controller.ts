import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { ZodValidationPipe } from "@/shared/validation/zod-pipe";

import { AuthSession, SessionAuthGuard } from "@/modules/auth";
import type { AuthSessionContext } from "@/modules/auth";

import { ClubIdParamSchema } from "../schemas/clubs.schema";
import {
  ClubSeasonIdParamSchema,
  CreateSeasonSchema,
  UpdateSeasonSchema,
  type CreateSeasonInput,
  type UpdateSeasonInput,
} from "../schemas/seasons.schema";
import {
  CreateSeason,
  GetSeason,
  ListSeasons,
  UpdateSeason,
} from "../use-cases/seasons";

@Controller("clubs")
@UseGuards(SessionAuthGuard)
export class SeasonsController {
  constructor(
    @Inject(CreateSeason) private readonly createSeason: CreateSeason,
    @Inject(UpdateSeason) private readonly updateSeason: UpdateSeason,
    @Inject(GetSeason) private readonly getSeason: GetSeason,
    @Inject(ListSeasons) private readonly listSeasons: ListSeasons,
  ) {}

  @Get(":clubId/seasons")
  async list(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
  ) {
    return this.listSeasons.execute(params.clubId, session.userId);
  }

  @Post(":clubId/seasons")
  @HttpCode(201)
  async create(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubIdParamSchema))
    params: { clubId: number },
    @Body(new ZodValidationPipe(CreateSeasonSchema))
    body: CreateSeasonInput,
  ) {
    return this.createSeason.execute(params.clubId, session.userId, body);
  }

  @Get(":clubId/seasons/:seasonId")
  async get(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubSeasonIdParamSchema))
    params: { clubId: number; seasonId: number },
  ) {
    return this.getSeason.execute(
      params.clubId,
      params.seasonId,
      session.userId,
    );
  }

  @Patch(":clubId/seasons/:seasonId")
  async patch(
    @AuthSession() session: AuthSessionContext,
    @Param(new ZodValidationPipe(ClubSeasonIdParamSchema))
    params: { clubId: number; seasonId: number },
    @Body(new ZodValidationPipe(UpdateSeasonSchema))
    body: UpdateSeasonInput,
  ) {
    return this.updateSeason.execute(
      params.clubId,
      params.seasonId,
      session.userId,
      body,
    );
  }
}
