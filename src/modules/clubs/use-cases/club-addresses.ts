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
    streetName: row.streetName,
    streetNumber: row.streetNumber,
    zip: row.zip,
    city: row.city,
    region: row.region,
    countryId: row.countryId,
    name: row.name,
    short: row.short,
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

    const row = await this.db.transaction(async (tx) => {
      if (input.primary) {
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
        short: input.short,
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
        short: string;
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
      if (input.short !== undefined) patch.short = input.short;
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
