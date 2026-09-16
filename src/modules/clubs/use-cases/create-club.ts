import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
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
  sn: string;
  establishedDate: string | null;
  active: boolean;
  countryCode: string;
  activities: Array<{ id: number; name: string; sn: string }>;
  languages: Array<{
    languageId: number;
    code: string;
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
    countryId: number | null;
    name: string;
    short: string;
    directions: string | null;
    primary: boolean;
    active: boolean | null;
    createdAt: string;
    updatedAt: string;
  }>;
  adminUserIds: string[];
  avatars: ClubAvatarsSigned;
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
    const [activities, languages, addresses, adminUserIds, avatarSlots] =
      await Promise.all([
        this.catalog.listClubActivities(db, club.id),
        this.catalog.listClubLanguages(db, club.id),
        this.addresses.listByClubId(db, club.id),
        this.clubs.listAdminUserIds(db, club.id),
        this.avatars.findByClubId(db, club.id),
      ]);

    return {
      id: club.id,
      name: club.name,
      sn: club.shortName,
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
        countryId: row.countryId,
        name: row.name,
        short: row.shortName,
        directions: row.directions,
        primary: row.primary,
        active: row.active,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      adminUserIds,
      avatars: await this.signAvatars(avatarSlots),
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    };
  }

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
    const existing = await this.clubs.findBySn(this.db, input.sn);
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
      throw new ValidationError("One or more languageIds are invalid");
    }

    const club = await this.db.transaction(async (tx) => {
      const created = await this.clubs.insertClub(tx, {
        name: input.name,
        shortName: input.sn,
        establishedDate: input.establishedDate ?? null,
        active: input.active,
        countryCode: input.countryCode,
      });
      await this.clubs.insertAdmin(tx, created.id, userId);
      await this.clubs.replaceActivities(tx, created.id, input.activityIds);
      await this.clubs.replaceLanguages(tx, created.id, input.languages);
      return created;
    });

    if (avatar?.buffer?.length) {
      await this.storeAvatar(club.id, avatar);
    }

    return this.assembler.assemble(this.db, club);
  }

  private async storeAvatar(
    clubId: number,
    avatar: CreateClubAvatarFile,
  ): Promise<void> {
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

    await this.avatarsRepository.upsertSlots(this.db, clubId, keys);
  }
}
