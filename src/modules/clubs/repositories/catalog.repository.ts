import { asc, eq, inArray } from "drizzle-orm";
import { Injectable } from "@nestjs/common";

import type { DbOrTx } from "@/db";
import {
  activitiesInApp,
  clubActivitiesInApp,
  clubLanguagesInApp,
  languagesInApp,
} from "@/db/schema";

@Injectable()
export class CatalogRepository {
  async listActiveActivities(dbOrTx: DbOrTx) {
    return dbOrTx
      .select({
        id: activitiesInApp.id,
        name: activitiesInApp.name,
        sn: activitiesInApp.shortName,
        active: activitiesInApp.active,
      })
      .from(activitiesInApp)
      .where(eq(activitiesInApp.active, true))
      .orderBy(asc(activitiesInApp.id));
  }

  async listActiveLanguages(dbOrTx: DbOrTx) {
    return dbOrTx
      .select({
        id: languagesInApp.id,
        code: languagesInApp.code,
        name: languagesInApp.name,
        active: languagesInApp.active,
      })
      .from(languagesInApp)
      .where(eq(languagesInApp.active, true))
      .orderBy(asc(languagesInApp.id));
  }

  async listClubActivities(dbOrTx: DbOrTx, clubId: number) {
    return dbOrTx
      .select({
        id: activitiesInApp.id,
        name: activitiesInApp.name,
        sn: activitiesInApp.shortName,
      })
      .from(clubActivitiesInApp)
      .innerJoin(
        activitiesInApp,
        eq(clubActivitiesInApp.activityId, activitiesInApp.id),
      )
      .where(eq(clubActivitiesInApp.clubId, clubId))
      .orderBy(asc(activitiesInApp.id));
  }

  async listClubLanguages(dbOrTx: DbOrTx, clubId: number) {
    return dbOrTx
      .select({
        languageId: languagesInApp.id,
        code: languagesInApp.code,
        name: languagesInApp.name,
        rank: clubLanguagesInApp.rank,
      })
      .from(clubLanguagesInApp)
      .innerJoin(
        languagesInApp,
        eq(clubLanguagesInApp.languageId, languagesInApp.id),
      )
      .where(eq(clubLanguagesInApp.clubId, clubId))
      .orderBy(asc(clubLanguagesInApp.rank));
  }

  async assertActivityIdsExist(
    dbOrTx: DbOrTx,
    activityIds: number[],
  ): Promise<boolean> {
    if (activityIds.length === 0) {
      return true;
    }
    const unique = [...new Set(activityIds)];
    const rows = await dbOrTx
      .select({ id: activitiesInApp.id })
      .from(activitiesInApp)
      .where(inArray(activitiesInApp.id, unique));
    return rows.length === unique.length;
  }

  async assertLanguageIdsExist(
    dbOrTx: DbOrTx,
    languageIds: number[],
  ): Promise<boolean> {
    if (languageIds.length === 0) {
      return true;
    }
    const unique = [...new Set(languageIds)];
    const rows = await dbOrTx
      .select({ id: languagesInApp.id })
      .from(languagesInApp)
      .where(inArray(languagesInApp.id, unique));
    return rows.length === unique.length;
  }
}
