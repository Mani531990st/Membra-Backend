import { asc, eq, sql } from "drizzle-orm";
import { Injectable } from "@nestjs/common";

import type { DbOrTx } from "@/db";
import { clubAvatarsInApp } from "@/db/schema";

export type ClubAvatarSlots = {
  avatar1: string | null;
  avatar2: string | null;
  avatar3: string | null;
};

@Injectable()
export class ClubAvatarsRepository {
  async findByClubId(
    dbOrTx: DbOrTx,
    clubId: number,
  ): Promise<ClubAvatarSlots | null> {
    const [row] = await dbOrTx
      .select({
        avatar1: clubAvatarsInApp.avatar1,
        avatar2: clubAvatarsInApp.avatar2,
        avatar3: clubAvatarsInApp.avatar3,
      })
      .from(clubAvatarsInApp)
      .where(eq(clubAvatarsInApp.clubId, clubId))
      .limit(1);
    return row ?? null;
  }

  async upsertSlots(
    dbOrTx: DbOrTx,
    clubId: number,
    slots: ClubAvatarSlots,
  ): Promise<ClubAvatarSlots> {
    const [row] = await dbOrTx
      .insert(clubAvatarsInApp)
      .values({
        clubId,
        avatar1: slots.avatar1,
        avatar2: slots.avatar2,
        avatar3: slots.avatar3,
      })
      .onConflictDoUpdate({
        target: clubAvatarsInApp.clubId,
        set: {
          avatar1: slots.avatar1,
          avatar2: slots.avatar2,
          avatar3: slots.avatar3,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning({
        avatar1: clubAvatarsInApp.avatar1,
        avatar2: clubAvatarsInApp.avatar2,
        avatar3: clubAvatarsInApp.avatar3,
      });

    if (!row) {
      throw new Error("Failed to upsert club avatars");
    }
    return row;
  }
}
