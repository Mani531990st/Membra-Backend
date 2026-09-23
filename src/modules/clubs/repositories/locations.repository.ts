import { and, eq, sql } from "drizzle-orm";
import { Injectable } from "@nestjs/common";

import type { DbOrTx } from "@/db";
import { clubAddressesInApp, locationsInApp } from "@/db/schema";

export type LocationRow = typeof locationsInApp.$inferSelect;

export type LocationInsert = {
  clubId: number;
  name: string;
  shortName: string;
  shownName: string;
  directions: string | null;
  clubAddressId: number | null;
  canMemberBook: boolean | null;
  canTeamBook: boolean;
  memberReqToBook: number | null;
  public: boolean;
  canFriendshipClubBook: boolean;
  active: boolean;
  parentLocationId: number | null;
};

@Injectable()
export class LocationsRepository {
  async insert(dbOrTx: DbOrTx, values: LocationInsert): Promise<LocationRow> {
    const [row] = await dbOrTx.insert(locationsInApp).values(values).returning();
    if (!row) {
      throw new Error("Failed to insert location");
    }
    return row;
  }

  async findByIdForClub(
    dbOrTx: DbOrTx,
    clubId: number,
    locationId: number,
  ): Promise<LocationRow | null> {
    const [row] = await dbOrTx
      .select()
      .from(locationsInApp)
      .where(
        and(
          eq(locationsInApp.id, locationId),
          eq(locationsInApp.clubId, clubId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listByClubId(dbOrTx: DbOrTx, clubId: number): Promise<LocationRow[]> {
    return dbOrTx
      .select()
      .from(locationsInApp)
      .where(eq(locationsInApp.clubId, clubId));
  }

  async update(
    dbOrTx: DbOrTx,
    clubId: number,
    locationId: number,
    values: Partial<Omit<LocationInsert, "clubId">>,
  ): Promise<LocationRow | null> {
    const [row] = await dbOrTx
      .update(locationsInApp)
      .set({
        ...values,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(locationsInApp.id, locationId),
          eq(locationsInApp.clubId, clubId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async updateShownNames(
    dbOrTx: DbOrTx,
    updates: Array<{ id: number; shownName: string }>,
  ): Promise<void> {
    for (const update of updates) {
      await dbOrTx
        .update(locationsInApp)
        .set({
          shownName: update.shownName,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(locationsInApp.id, update.id));
    }
  }

  async updateActiveByIds(
    dbOrTx: DbOrTx,
    clubId: number,
    ids: number[],
    active: boolean,
  ): Promise<void> {
    for (const id of ids) {
      await dbOrTx
        .update(locationsInApp)
        .set({
          active,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(
          and(eq(locationsInApp.id, id), eq(locationsInApp.clubId, clubId)),
        );
    }
  }

  /**
   * Deletes locations by id in the given order (caller must pass deepest-first).
   * Scoped to clubId so ids from another club are ignored.
   */
  async deleteByIds(
    dbOrTx: DbOrTx,
    clubId: number,
    ids: number[],
  ): Promise<void> {
    for (const id of ids) {
      await dbOrTx
        .delete(locationsInApp)
        .where(
          and(eq(locationsInApp.id, id), eq(locationsInApp.clubId, clubId)),
        );
    }
  }

  async addressBelongsToClub(
    dbOrTx: DbOrTx,
    clubId: number,
    addressId: number,
  ): Promise<boolean> {
    const [row] = await dbOrTx
      .select({ id: clubAddressesInApp.id })
      .from(clubAddressesInApp)
      .where(
        and(
          eq(clubAddressesInApp.id, addressId),
          eq(clubAddressesInApp.clubId, clubId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }
}
