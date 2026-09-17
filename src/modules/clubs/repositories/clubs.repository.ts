import { and, asc, count, eq, sql } from "drizzle-orm";
import { Injectable } from "@nestjs/common";

import type { DbOrTx } from "@/db";
import {
  clubActivitiesInApp,
  clubAdminsInApp,
  clubLanguagesInApp,
  clubsInApp,
} from "@/db/schema";

export type ClubRow = typeof clubsInApp.$inferSelect;

@Injectable()
export class ClubsRepository {
  async insertClub(
    dbOrTx: DbOrTx,
    values: {
      name: string;
      shortName: string;
      establishedDate: string | null;
      active: boolean;
      countryCode: string;
    },
  ): Promise<ClubRow> {
    const [row] = await dbOrTx
      .insert(clubsInApp)
      .values({
        name: values.name,
        shortName: values.shortName,
        establishedDate: values.establishedDate,
        active: values.active,
        countryCode: values.countryCode,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to insert club");
    }
    return row;
  }

  async findById(dbOrTx: DbOrTx, clubId: number): Promise<ClubRow | null> {
    const [row] = await dbOrTx
      .select()
      .from(clubsInApp)
      .where(eq(clubsInApp.id, clubId))
      .limit(1);
    return row ?? null;
  }

  async findBySn(dbOrTx: DbOrTx, sn: string): Promise<ClubRow | null> {
    const [row] = await dbOrTx
      .select()
      .from(clubsInApp)
      .where(eq(clubsInApp.shortName, sn))
      .limit(1);
    return row ?? null;
  }

  /** Clubs the user administers (includes inactive), ordered by name. */
  async listByAdminUserId(dbOrTx: DbOrTx, userId: string): Promise<ClubRow[]> {
    return dbOrTx
      .select({
        id: clubsInApp.id,
        name: clubsInApp.name,
        shortName: clubsInApp.shortName,
        establishedDate: clubsInApp.establishedDate,
        active: clubsInApp.active,
        countryCode: clubsInApp.countryCode,
        createdAt: clubsInApp.createdAt,
        updatedAt: clubsInApp.updatedAt,
      })
      .from(clubAdminsInApp)
      .innerJoin(clubsInApp, eq(clubAdminsInApp.clubId, clubsInApp.id))
      .where(eq(clubAdminsInApp.userId, userId))
      .orderBy(asc(clubsInApp.name));
  }

  async updateClub(
    dbOrTx: DbOrTx,
    clubId: number,
    values: Partial<{
      name: string;
      shortName: string;
      establishedDate: string | null;
      active: boolean;
      countryCode: string;
    }>,
  ): Promise<ClubRow | null> {
    const [row] = await dbOrTx
      .update(clubsInApp)
      .set({
        ...values,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(clubsInApp.id, clubId))
      .returning();
    return row ?? null;
  }

  async insertAdmin(
    dbOrTx: DbOrTx,
    clubId: number,
    userId: string,
  ): Promise<void> {
    await dbOrTx.insert(clubAdminsInApp).values({ clubId, userId });
  }

  async isAdmin(
    dbOrTx: DbOrTx,
    clubId: number,
    userId: string,
  ): Promise<boolean> {
    const [row] = await dbOrTx
      .select({ clubId: clubAdminsInApp.clubId })
      .from(clubAdminsInApp)
      .where(
        and(
          eq(clubAdminsInApp.clubId, clubId),
          eq(clubAdminsInApp.userId, userId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async countAdmins(dbOrTx: DbOrTx, clubId: number): Promise<number> {
    const [row] = await dbOrTx
      .select({ value: count() })
      .from(clubAdminsInApp)
      .where(eq(clubAdminsInApp.clubId, clubId));
    return Number(row?.value ?? 0);
  }

  async replaceActivities(
    dbOrTx: DbOrTx,
    clubId: number,
    activityIds: number[],
  ): Promise<void> {
    await dbOrTx
      .delete(clubActivitiesInApp)
      .where(eq(clubActivitiesInApp.clubId, clubId));

    if (activityIds.length === 0) {
      return;
    }

    await dbOrTx.insert(clubActivitiesInApp).values(
      activityIds.map((activityId) => ({ clubId, activityId })),
    );
  }

  async replaceLanguages(
    dbOrTx: DbOrTx,
    clubId: number,
    languages: Array<{ languageId: number; rank: number }>,
  ): Promise<void> {
    await dbOrTx
      .delete(clubLanguagesInApp)
      .where(eq(clubLanguagesInApp.clubId, clubId));

    if (languages.length === 0) {
      return;
    }

    await dbOrTx.insert(clubLanguagesInApp).values(
      languages.map((entry) => ({
        clubId,
        languageId: entry.languageId,
        rank: entry.rank,
      })),
    );
  }
}
