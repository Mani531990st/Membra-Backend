import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { isUniqueViolation } from "@/shared/db/pg-errors";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors";

import { ClubAccess } from "../lib/club-access";
import {
  ClubAddressesRepository,
  type ClubAddressRow,
} from "../repositories/club-addresses.repository";
import type {
  ClubAddressBody,
  UpdateClubAddressInput,
} from "../schemas/clubs.schema";

function mapAddress(row: ClubAddressRow) {
  return {
    id: row.id,
    streetName: row.streetName,
    streetNumber: row.streetNumber,
    zip: row.zip,
    city: row.city,
    region: row.region,
    name: row.name,
    shortName: row.shortName,
    directions: row.directions,
    primary: row.primary,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class AddClubAddress {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(ClubAddressesRepository)
    private readonly addresses: ClubAddressesRepository,
  ) {}

  async execute(clubId: number, userId: string, input: ClubAddressBody) {
    await this.access.requireAdmin(clubId, userId);

    const primaryCount = await this.addresses.countPrimaries(this.db, clubId);
    // A club with addresses must have exactly one primary: force primary when none exist.
    const primary = primaryCount === 0 ? true : input.primary;
    const active = input.active ?? true;

    if (primary && active === false) {
      throw new ValidationError("primary address cannot be inactive");
    }

    try {
      const row = await this.db.transaction(async (tx) => {
        if (primary) {
          await this.addresses.clearPrimaryExcept(tx, clubId);
        }
        return this.addresses.insert(tx, {
          clubId,
          streetName: input.streetName,
          streetNumber: input.streetNumber,
          zip: input.zip,
          city: input.city,
          region: input.region ?? null,
          name: input.name,
          shortName: input.shortName,
          directions: input.directions ?? null,
          primary,
          active,
        });
      });

      return mapAddress(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Club already has a primary address");
      }
      throw error;
    }
  }
}

@Injectable()
export class UpdateClubAddress {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(ClubAddressesRepository)
    private readonly addresses: ClubAddressesRepository,
  ) {}

  async execute(
    clubId: number,
    addressId: number,
    userId: string,
    input: UpdateClubAddressInput,
  ) {
    await this.access.requireAdmin(clubId, userId);

    const existing = await this.addresses.findByIdForClub(
      this.db,
      clubId,
      addressId,
    );
    if (!existing) {
      throw new NotFoundError("Club address not found");
    }

    const nextPrimary = input.primary ?? existing.primary;
    const nextActive =
      input.active !== undefined ? input.active : existing.active;
    if (nextPrimary && nextActive === false) {
      throw new ValidationError("primary address cannot be inactive");
    }

    // Refuse demoting the last primary (partial unique index still allows zero primaries).
    if (existing.primary && nextPrimary === false) {
      const primaryCount = await this.addresses.countPrimaries(this.db, clubId);
      if (primaryCount <= 1) {
        throw new ValidationError(
          "cannot demote the last primary address; make another address primary first",
        );
      }
    }

    try {
      const row = await this.db.transaction(async (tx) => {
        if (input.primary === true) {
          await this.addresses.clearPrimaryExcept(tx, clubId, addressId);
        }

        const patch: Partial<{
          streetName: string;
          streetNumber: string;
          zip: string;
          city: string;
          region: string | null;
          name: string;
          shortName: string;
          directions: string | null;
          primary: boolean;
          active: boolean | null;
        }> = {};

        if (input.streetName !== undefined) patch.streetName = input.streetName;
        if (input.streetNumber !== undefined)
          patch.streetNumber = input.streetNumber;
        if (input.zip !== undefined) patch.zip = input.zip;
        if (input.city !== undefined) patch.city = input.city;
        if (input.region !== undefined) patch.region = input.region;
        if (input.name !== undefined) patch.name = input.name;
        if (input.shortName !== undefined) patch.shortName = input.shortName;
        if (input.directions !== undefined) patch.directions = input.directions;
        if (input.primary !== undefined) patch.primary = input.primary;
        if (input.active !== undefined) patch.active = input.active;

        return this.addresses.update(tx, clubId, addressId, patch);
      });

      if (!row) {
        throw new NotFoundError("Club address not found");
      }
      return mapAddress(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Club already has a primary address");
      }
      throw error;
    }
  }
}

@Injectable()
export class MakeClubAddressPrimary {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(ClubAddressesRepository)
    private readonly addresses: ClubAddressesRepository,
  ) {}

  async execute(clubId: number, addressId: number, userId: string) {
    await this.access.requireAdmin(clubId, userId);

    const existing = await this.addresses.findByIdForClub(
      this.db,
      clubId,
      addressId,
    );
    if (!existing) {
      throw new NotFoundError("Club address not found");
    }

    try {
      const row = await this.db.transaction(async (tx) =>
        this.addresses.setPrimary(tx, clubId, addressId),
      );
      if (!row) {
        throw new NotFoundError("Club address not found");
      }
      return mapAddress(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Club already has a primary address");
      }
      throw error;
    }
  }
}
