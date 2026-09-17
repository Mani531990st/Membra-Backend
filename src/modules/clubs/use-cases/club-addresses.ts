import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { NotFoundError, ValidationError } from "@/shared/errors";

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
    street_name: row.streetName,
    street_number: row.streetNumber,
    zip: row.zip,
    city: row.city,
    region: row.region,
    country_id: row.countryId,
    name: row.name,
    short_name: row.shortName,
    directions: row.directions,
    primary: row.primary,
    active: row.active,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
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

    const row = await this.db.transaction(async (tx) => {
      if (input.primary) {
        await this.addresses.clearPrimaryExcept(tx, clubId);
      }
      return this.addresses.insert(tx, {
        clubId,
        streetName: input.street_name,
        streetNumber: input.street_number,
        zip: input.zip,
        city: input.city,
        region: input.region ?? null,
        name: input.name,
        shortName: input.short_name,
        directions: input.directions ?? null,
        primary: input.primary,
        active: input.active ?? true,
      });
    });

    return mapAddress(row);
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

      if (input.street_name !== undefined) patch.streetName = input.street_name;
      if (input.street_number !== undefined)
        patch.streetNumber = input.street_number;
      if (input.zip !== undefined) patch.zip = input.zip;
      if (input.city !== undefined) patch.city = input.city;
      if (input.region !== undefined) patch.region = input.region;
      if (input.name !== undefined) patch.name = input.name;
      if (input.short_name !== undefined) patch.shortName = input.short_name;
      if (input.directions !== undefined) patch.directions = input.directions;
      if (input.primary !== undefined) patch.primary = input.primary;
      if (input.active !== undefined) patch.active = input.active;

      return this.addresses.update(tx, clubId, addressId, patch);
    });

    if (!row) {
      throw new NotFoundError("Club address not found");
    }
    return mapAddress(row);
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

    const row = await this.db.transaction(async (tx) =>
      this.addresses.setPrimary(tx, clubId, addressId),
    );
    if (!row) {
      throw new NotFoundError("Club address not found");
    }
    return mapAddress(row);
  }
}
