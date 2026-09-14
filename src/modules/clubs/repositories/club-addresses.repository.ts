import { and, asc, eq, ne, sql } from "drizzle-orm";
import { Injectable } from "@nestjs/common";

import type { DbOrTx } from "@/db";
import { clubAddressesInApp } from "@/db/schema";

export type ClubAddressRow = typeof clubAddressesInApp.$inferSelect;

export type ClubAddressInsert = {
  clubId: number;
  streetName: string;
  streetNumber: string;
  zip: string;
  city: string;
  region: string | null;
  name: string;
  short: string;
  directions: string | null;
  primary: boolean;
  active: boolean | null;
};

@Injectable()
export class ClubAddressesRepository {
  async insert(
    dbOrTx: DbOrTx,
    values: ClubAddressInsert,
  ): Promise<ClubAddressRow> {
    const [row] = await dbOrTx
      .insert(clubAddressesInApp)
      .values(values)
      .returning();
    if (!row) {
      throw new Error("Failed to insert club address");
    }
    return row;
  }

  async findByIdForClub(
    dbOrTx: DbOrTx,
    clubId: number,
    addressId: number,
  ): Promise<ClubAddressRow | null> {
    const [row] = await dbOrTx
      .select()
      .from(clubAddressesInApp)
      .where(
        and(
          eq(clubAddressesInApp.id, addressId),
          eq(clubAddressesInApp.clubId, clubId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listByClubId(
    dbOrTx: DbOrTx,
    clubId: number,
  ): Promise<ClubAddressRow[]> {
    return dbOrTx
      .select()
      .from(clubAddressesInApp)
      .where(eq(clubAddressesInApp.clubId, clubId))
      .orderBy(asc(clubAddressesInApp.id));
  }

  async update(
    dbOrTx: DbOrTx,
    clubId: number,
    addressId: number,
    values: Partial<Omit<ClubAddressInsert, "clubId">>,
  ): Promise<ClubAddressRow | null> {
    const [row] = await dbOrTx
      .update(clubAddressesInApp)
      .set({
        ...values,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(clubAddressesInApp.id, addressId),
          eq(clubAddressesInApp.clubId, clubId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async clearPrimaryExcept(
    dbOrTx: DbOrTx,
    clubId: number,
    exceptAddressId?: number,
  ): Promise<void> {
    const where =
      exceptAddressId === undefined
        ? eq(clubAddressesInApp.clubId, clubId)
        : and(
            eq(clubAddressesInApp.clubId, clubId),
            ne(clubAddressesInApp.id, exceptAddressId),
          );

    await dbOrTx
      .update(clubAddressesInApp)
      .set({
        primary: false,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(where);
  }

  async setPrimary(
    dbOrTx: DbOrTx,
    clubId: number,
    addressId: number,
  ): Promise<ClubAddressRow | null> {
    await this.clearPrimaryExcept(dbOrTx, clubId, addressId);
    const [row] = await dbOrTx
      .update(clubAddressesInApp)
      .set({
        primary: true,
        active: true,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(clubAddressesInApp.id, addressId),
          eq(clubAddressesInApp.clubId, clubId),
        ),
      )
      .returning();
    return row ?? null;
  }
}
