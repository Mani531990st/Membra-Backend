import { and, eq, sql } from "drizzle-orm";
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
      sn: string;
      date: string | null;
      active: boolean;
      countryCode: string;
    },
  ): Promise<ClubRow> {
    const [row] = await dbOrTx
      .insert(clubsInApp)
      .values({
        name: values.name,
        sn: values.sn,
        date: values.date,
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
      .where(eq(clubsInApp.sn, sn))
      .limit(1);
    return row ?? null;
  }

  async updateClub(
    dbOrTx: DbOrTx,
    clubId: number,
    values: Partial<{
      name: string;
      sn: string;
      date: string | null;
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

  async listAdminUserIds(dbOrTx: DbOrTx, clubId: number): Promise<string[]> {
    const rows = await dbOrTx
      .select({ userId: clubAdminsInApp.userId })
      .from(clubAdminsInApp)
      .where(eq(clubAdminsInApp.clubId, clubId));
    return rows.map((row) => row.userId);
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
