import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { ClubAvatarsRepository } from "../repositories/club-avatars.repository";
import { ClubsRepository } from "../repositories/clubs.repository";
import {
  ClubDetailAssembler,
  type ClubAvatarsSigned,
} from "./create-club";

export type ClubSummary = {
  id: number;
  name: string;
  shortName: string;
  establishedDate: string | null;
  active: boolean;
  countryCode: string;
  adminCount: number;
  avatars: ClubAvatarsSigned;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class ListAdminClubs {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubsRepository) private readonly clubs: ClubsRepository,
    @Inject(ClubAvatarsRepository)
    private readonly avatarsRepository: ClubAvatarsRepository,
    @Inject(ClubDetailAssembler)
    private readonly assembler: ClubDetailAssembler,
  ) {}

  async execute(userId: string): Promise<{ clubs: ClubSummary[] }> {
    const rows = await this.clubs.listByAdminUserId(this.db, userId);
    if (rows.length === 0) {
      return { clubs: [] };
    }

    const clubIds = rows.map((row) => row.id);
    const avatarMap = await this.avatarsRepository.findByClubIds(
      this.db,
      clubIds,
    );

    const clubs = await Promise.all(
      rows.map(async (club) => {
        const [adminCount, avatars] = await Promise.all([
          this.clubs.countAdmins(this.db, club.id),
          this.assembler.signAvatars(avatarMap.get(club.id) ?? null),
        ]);

        return {
          id: club.id,
          name: club.name,
          shortName: club.shortName,
          establishedDate: club.establishedDate,
          active: club.active,
          countryCode: club.countryCode,
          adminCount,
          avatars,
          createdAt: club.createdAt,
          updatedAt: club.updatedAt,
        };
      }),
    );

    return { clubs };
  }
}
