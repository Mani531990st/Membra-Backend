import { and, asc, eq, sql } from "drizzle-orm";
import { Injectable } from "@nestjs/common";

import type { DbOrTx } from "@/db";
import { seasonsInApp } from "@/db/schema";

export type SeasonRow = typeof seasonsInApp.$inferSelect;

export type SeasonInsert = {
  clubId: number;
  name: string;
  shortName: string;
  seasonStart: string;
  seasonEnd: string;
  forTeams: boolean;
  forLocations: boolean;
  active: boolean;
};

@Injectable()
export class SeasonsRepository {
  async insert(dbOrTx: DbOrTx, values: SeasonInsert): Promise<SeasonRow> {
    const [row] = await dbOrTx.insert(seasonsInApp).values(values).returning();
    if (!row) {
      throw new Error("Failed to insert season");
    }
    return row;
  }

  async findByIdForClub(
    dbOrTx: DbOrTx,
    clubId: number,
    seasonId: number,
  ): Promise<SeasonRow | null> {
    const [row] = await dbOrTx
      .select()
      .from(seasonsInApp)
      .where(
        and(eq(seasonsInApp.id, seasonId), eq(seasonsInApp.clubId, clubId)),
      )
      .limit(1);
    return row ?? null;
  }

  async listByClubId(dbOrTx: DbOrTx, clubId: number): Promise<SeasonRow[]> {
    return dbOrTx
      .select()
      .from(seasonsInApp)
      .where(eq(seasonsInApp.clubId, clubId))
      .orderBy(asc(seasonsInApp.seasonStart), asc(seasonsInApp.id));
  }

  async update(
    dbOrTx: DbOrTx,
    clubId: number,
    seasonId: number,
    values: Partial<Omit<SeasonInsert, "clubId">>,
  ): Promise<SeasonRow | null> {
    const [row] = await dbOrTx
      .update(seasonsInApp)
      .set({
        ...values,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(eq(seasonsInApp.id, seasonId), eq(seasonsInApp.clubId, clubId)),
      )
      .returning();
    return row ?? null;
  }
}
