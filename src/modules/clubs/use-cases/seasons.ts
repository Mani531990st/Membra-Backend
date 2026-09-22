import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { isUniqueViolation } from "@/shared/db/pg-errors";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors";

import { ClubAccess } from "../lib/club-access";
import {
  SeasonsRepository,
  type SeasonRow,
} from "../repositories/seasons.repository";
import type {
  CreateSeasonInput,
  UpdateSeasonInput,
} from "../schemas/seasons.schema";

function mapSeason(row: SeasonRow) {
  return {
    id: row.id,
    clubId: row.clubId,
    name: row.name,
    shortName: row.shortName,
    seasonStart: row.seasonStart,
    seasonEnd: row.seasonEnd,
    forTeams: row.forTeams,
    forLocations: row.forLocations,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class CreateSeason {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(SeasonsRepository) private readonly seasons: SeasonsRepository,
  ) {}

  async execute(clubId: number, userId: string, input: CreateSeasonInput) {
    await this.access.requireAdmin(clubId, userId);

    try {
      const row = await this.seasons.insert(this.db, {
        clubId,
        name: input.name,
        shortName: input.shortName,
        seasonStart: input.seasonStart,
        seasonEnd: input.seasonEnd,
        forTeams: input.forTeams,
        forLocations: input.forLocations,
        active: input.active ?? true,
      });
      return mapSeason(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          "A season with this shortName already exists for this club",
        );
      }
      throw error;
    }
  }
}

@Injectable()
export class UpdateSeason {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(SeasonsRepository) private readonly seasons: SeasonsRepository,
  ) {}

  async execute(
    clubId: number,
    seasonId: number,
    userId: string,
    input: UpdateSeasonInput,
  ) {
    await this.access.requireAdmin(clubId, userId);

    const existing = await this.seasons.findByIdForClub(
      this.db,
      clubId,
      seasonId,
    );
    if (!existing) {
      throw new NotFoundError("Season not found");
    }

    const nextStart = input.seasonStart ?? existing.seasonStart;
    const nextEnd = input.seasonEnd ?? existing.seasonEnd;
    if (nextEnd < nextStart) {
      throw new ValidationError("seasonEnd must be on or after seasonStart");
    }

    try {
      const patch: Partial<{
        name: string;
        shortName: string;
        seasonStart: string;
        seasonEnd: string;
        forTeams: boolean;
        forLocations: boolean;
        active: boolean;
      }> = {};

      if (input.name !== undefined) patch.name = input.name;
      if (input.shortName !== undefined) patch.shortName = input.shortName;
      if (input.seasonStart !== undefined) patch.seasonStart = input.seasonStart;
      if (input.seasonEnd !== undefined) patch.seasonEnd = input.seasonEnd;
      if (input.forTeams !== undefined) patch.forTeams = input.forTeams;
      if (input.forLocations !== undefined) {
        patch.forLocations = input.forLocations;
      }
      if (input.active !== undefined) patch.active = input.active;

      const row = await this.seasons.update(this.db, clubId, seasonId, patch);
      if (!row) {
        throw new NotFoundError("Season not found");
      }
      return mapSeason(row);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          "A season with this shortName already exists for this club",
        );
      }
      throw error;
    }
  }
}

@Injectable()
export class GetSeason {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(SeasonsRepository) private readonly seasons: SeasonsRepository,
  ) {}

  async execute(clubId: number, seasonId: number, userId: string) {
    await this.access.requireMember(clubId, userId);
    const row = await this.seasons.findByIdForClub(this.db, clubId, seasonId);
    if (!row) {
      throw new NotFoundError("Season not found");
    }
    return mapSeason(row);
  }
}

@Injectable()
export class ListSeasons {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(SeasonsRepository) private readonly seasons: SeasonsRepository,
  ) {}

  async execute(clubId: number, userId: string) {
    await this.access.requireMember(clubId, userId);
    const rows = await this.seasons.listByClubId(this.db, clubId);
    return { seasons: rows.map(mapSeason) };
  }
}
