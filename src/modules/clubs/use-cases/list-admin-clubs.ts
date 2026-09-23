import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { ClubAvatarsRepository } from "../repositories/club-avatars.repository";
import { ClubsRepository } from "../repositories/clubs.repository";
import { ClubDetailAssembler } from "./create-club";

export type ClubSummary = {
  id: number;
  name: string;
  shortName: string;
  establishedDate: string | null;
  active: boolean;
  adminCount: number;
  /** Signed URL for avatar2 (96×96), or null when unset. */
  avatar: string | null;
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
        const [adminCount, avatar] = await Promise.all([
          this.clubs.countAdmins(this.db, club.id),
          this.assembler.signAvatar(avatarMap.get(club.id) ?? null),
        ]);

        return {
          id: club.id,
          name: club.name,
          shortName: club.shortName,
          establishedDate: club.establishedDate,
          active: club.active,
          adminCount,
          avatar,
          createdAt: club.createdAt,
          updatedAt: club.updatedAt,
        };
      }),
    );

    return { clubs };
  }
}
