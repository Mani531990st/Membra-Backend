import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { isUniqueViolation } from "@/shared/db/pg-errors";
import { ConflictError, ValidationError } from "@/shared/errors";
import {
  buildAvatarVariants,
  clubAvatarObjectKey,
} from "@/shared/images/avatar-image";
import {
  SCALEWAY_OBJECT_STORAGE,
  ScalewayObjectStorage,
} from "@/shared/storage/scaleway-object-storage";

import { CatalogRepository } from "../repositories/catalog.repository";
import { ClubAddressesRepository } from "../repositories/club-addresses.repository";
import {
  ClubAvatarsRepository,
  type ClubAvatarSlots,
} from "../repositories/club-avatars.repository";
import { ClubsRepository, type ClubRow } from "../repositories/clubs.repository";
import type { CreateClubInput } from "../schemas/clubs.schema";

export type ClubAvatarsSigned = {
  avatar1: string | null;
  avatar2: string | null;
  avatar3: string | null;
};

export type ClubDetail = {
  id: number;
  name: string;
  shortName: string;
  establishedDate: string | null;
  active: boolean;
  countryCode: string;
  activities: Array<{ id: number; activity: string }>;
  languages: Array<{
    languageId: string;
    name: string;
    rank: number;
  }>;
  addresses: Array<{
    id: number;
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
    createdAt: string;
    updatedAt: string;
  }>;
  adminCount: number;
  /** Signed URL for avatar2 (96×96), or null when unset. */
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateClubAvatarFile = {
  buffer: Buffer;
  mimetype?: string;
  size: number;
};

@Injectable()
export class ClubDetailAssembler {
  constructor(
    @Inject(ClubAddressesRepository)
    private readonly addresses: ClubAddressesRepository,
    @Inject(CatalogRepository) private readonly catalog: CatalogRepository,
    @Inject(ClubsRepository) private readonly clubs: ClubsRepository,
    @Inject(ClubAvatarsRepository)
    private readonly avatars: ClubAvatarsRepository,
    @Inject(SCALEWAY_OBJECT_STORAGE)
    private readonly storage: ScalewayObjectStorage,
  ) {}

  async assemble(db: Database, club: ClubRow): Promise<ClubDetail> {
    const [activities, languages, addresses, adminCount, avatarSlots] =
      await Promise.all([
        this.catalog.listClubActivities(db, club.id),
        this.catalog.listClubLanguages(db, club.id),
        this.addresses.listByClubId(db, club.id),
        this.clubs.countAdmins(db, club.id),
        this.avatars.findByClubId(db, club.id),
      ]);

    return {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      establishedDate: club.establishedDate,
      active: club.active,
      countryCode: club.countryCode,
      activities,
      languages,
      addresses: addresses.map((row) => ({
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
      })),
      adminCount,
      avatar: await this.signAvatar(avatarSlots),
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    };
  }

  /** Signed URL for the 96×96 (avatar2) slot only — used on club list/detail. */
  async signAvatar(slots: ClubAvatarSlots | null): Promise<string | null> {
    if (!slots?.avatar2) {
      return null;
    }
    return this.storage.getSignedGetUrl(slots.avatar2);
  }

  /** All three signed slots — used by GET/PUT /clubs/:id/avatars. */
  async signAvatars(slots: ClubAvatarSlots | null): Promise<ClubAvatarsSigned> {
    if (!slots) {
      return { avatar1: null, avatar2: null, avatar3: null };
    }
    return {
      avatar1: slots.avatar1
        ? await this.storage.getSignedGetUrl(slots.avatar1)
        : null,
      avatar2: slots.avatar2
        ? await this.storage.getSignedGetUrl(slots.avatar2)
        : null,
      avatar3: slots.avatar3
        ? await this.storage.getSignedGetUrl(slots.avatar3)
        : null,
    };
  }
}

@Injectable()
export class CreateClub {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubsRepository) private readonly clubs: ClubsRepository,
    @Inject(CatalogRepository) private readonly catalog: CatalogRepository,
    @Inject(ClubAddressesRepository)
    private readonly addresses: ClubAddressesRepository,
    @Inject(ClubAvatarsRepository)
    private readonly avatarsRepository: ClubAvatarsRepository,
    @Inject(SCALEWAY_OBJECT_STORAGE)
    private readonly storage: ScalewayObjectStorage,
    @Inject(ClubDetailAssembler)
    private readonly assembler: ClubDetailAssembler,
  ) {}

  async execute(
    userId: string,
    input: CreateClubInput,
    avatar?: CreateClubAvatarFile,
  ): Promise<ClubDetail> {
    const existing = await this.clubs.findBySn(this.db, input.shortName);
    if (existing) {
      throw new ConflictError("A club with this short name already exists");
    }

    const activityOk = await this.catalog.assertActivityIdsExist(
      this.db,
      input.activityIds,
    );
    if (!activityOk) {
      throw new ValidationError("One or more activityIds are invalid");
    }

    const languageIds = input.languages.map((entry) => entry.languageId);
    const languageOk = await this.catalog.assertLanguageIdsExist(
      this.db,
      languageIds,
    );
    if (!languageOk) {
      throw new ValidationError("One or more languageId values are invalid");
    }

    // Upload to object storage before the DB transaction so a failed create
    // never leaves a committed club without avatar rows (orphan S3 is OK).
    const avatarKeys = avatar?.buffer?.length
      ? await this.uploadAvatarObjects(avatar)
      : null;

    let club: ClubRow;
    try {
      club = await this.db.transaction(async (tx) => {
        const created = await this.clubs.insertClub(tx, {
          name: input.name,
          shortName: input.shortName,
          establishedDate: input.establishedDate ?? null,
          active: input.active,
          countryCode: input.countryCode,
        });
        await this.clubs.insertAdmin(tx, created.id, userId);
        await this.clubs.replaceActivities(tx, created.id, input.activityIds);
        await this.clubs.replaceLanguages(
          tx,
          created.id,
          input.languages.map((entry) => ({
            languageId: entry.languageId,
            rank: entry.rank,
          })),
        );
        for (const [index, address] of input.addresses.entries()) {
          await this.addresses.insert(tx, {
            clubId: created.id,
            streetName: address.streetName,
            streetNumber: address.streetNumber,
            zip: address.zip,
            city: address.city,
            region: address.region ?? null,
            name: address.name,
            shortName: address.shortName,
            directions: address.directions ?? null,
            primary: index === 0,
            active: address.active ?? true,
          });
        }
        if (avatarKeys) {
          await this.avatarsRepository.upsertSlots(tx, created.id, avatarKeys);
        }
        return created;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("A club with this short name already exists");
      }
      throw error;
    }

    return this.assembler.assemble(this.db, club);
  }

  private async uploadAvatarObjects(
    avatar: CreateClubAvatarFile,
  ): Promise<ClubAvatarSlots> {
    const variants = await buildAvatarVariants(avatar.buffer, avatar.mimetype);
    // Opaque asset id so object keys never embed the club primary key.
    const assetId = randomUUID();
    const keys = {
      avatar1: clubAvatarObjectKey(assetId, 1),
      avatar2: clubAvatarObjectKey(assetId, 2),
      avatar3: clubAvatarObjectKey(assetId, 3),
    };

    await Promise.all([
      this.storage.putObject({
        key: keys.avatar1,
        body: variants.original,
        contentType: "image/avif",
        cacheControl: "private, max-age=3600",
      }),
      this.storage.putObject({
        key: keys.avatar2,
        body: variants.medium,
        contentType: "image/avif",
        cacheControl: "private, max-age=3600",
      }),
      this.storage.putObject({
        key: keys.avatar3,
        body: variants.small,
        contentType: "image/avif",
        cacheControl: "private, max-age=3600",
      }),
    ]);

    return keys;
  }
}
