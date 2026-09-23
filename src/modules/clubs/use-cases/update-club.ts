import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { isUniqueViolation } from "@/shared/db/pg-errors";
import { ConflictError, ValidationError } from "@/shared/errors";

import { ClubAccess } from "../lib/club-access";
import { CatalogRepository } from "../repositories/catalog.repository";
import { ClubsRepository } from "../repositories/clubs.repository";
import type { UpdateClubInput } from "../schemas/clubs.schema";
import {
  ClubDetailAssembler,
  type ClubDetail,
} from "./create-club";

@Injectable()
export class UpdateClub {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(ClubsRepository) private readonly clubs: ClubsRepository,
    @Inject(CatalogRepository) private readonly catalog: CatalogRepository,
    @Inject(ClubDetailAssembler)
    private readonly assembler: ClubDetailAssembler,
  ) {}

  async execute(
    clubId: number,
    userId: string,
    input: UpdateClubInput,
  ): Promise<ClubDetail> {
    await this.access.requireAdmin(clubId, userId);

    if (input.shortName !== undefined) {
      const existing = await this.clubs.findBySn(this.db, input.shortName);
      if (existing && existing.id !== clubId) {
        throw new ConflictError("A club with this short name already exists");
      }
    }

    if (input.activityIds !== undefined) {
      const ok = await this.catalog.assertActivityIdsExist(
        this.db,
        input.activityIds,
      );
      if (!ok) {
        throw new ValidationError("One or more activityIds are invalid");
      }
    }

    if (input.languages !== undefined) {
      const ok = await this.catalog.assertLanguageIdsExist(
        this.db,
        input.languages.map((entry) => entry.languageId),
      );
      if (!ok) {
        throw new ValidationError("One or more languageId values are invalid");
      }
    }

    let club;
    try {
      club = await this.db.transaction(async (tx) => {
        const patch: Partial<{
          name: string;
          shortName: string;
          establishedDate: string | null;
          active: boolean;
        }> = {};
        if (input.name !== undefined) patch.name = input.name;
        if (input.shortName !== undefined) patch.shortName = input.shortName;
        if (input.establishedDate !== undefined)
          patch.establishedDate = input.establishedDate;
        if (input.active !== undefined) patch.active = input.active;

        const updated =
          Object.keys(patch).length > 0
            ? await this.clubs.updateClub(tx, clubId, patch)
            : await this.clubs.findById(tx, clubId);

        if (!updated) {
          throw new Error("Club disappeared during update");
        }

        if (input.activityIds !== undefined) {
          await this.clubs.replaceActivities(tx, clubId, input.activityIds);
        }
        if (input.languages !== undefined) {
          await this.clubs.replaceLanguages(
            tx,
            clubId,
            input.languages.map((entry) => ({
              languageId: entry.languageId,
              rank: entry.rank,
            })),
          );
        }

        return updated;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("A club with this short name already exists");
      }
      throw error;
    }

    return this.assembler.assemble(this.db, club);
  }
}
