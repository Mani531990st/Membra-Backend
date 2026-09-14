import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { ForbiddenError, NotFoundError } from "@/shared/errors";

import { ClubsRepository } from "../repositories/clubs.repository";

@Injectable()
export class ClubAccess {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubsRepository) private readonly clubs: ClubsRepository,
  ) {}

  async requireClub(clubId: number) {
    const club = await this.clubs.findById(this.db, clubId);
    if (!club) {
      throw new NotFoundError("Club not found");
    }
    return club;
  }

  async requireAdmin(clubId: number, userId: string): Promise<void> {
    await this.requireClub(clubId);
    const isAdmin = await this.clubs.isAdmin(this.db, clubId, userId);
    if (!isAdmin) {
      throw new ForbiddenError("You are not an admin of this club");
    }
  }
}
