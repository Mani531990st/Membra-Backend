import { randomUUID } from "node:crypto";

import { Inject, Injectable, Logger } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { ValidationError } from "@/shared/errors";
import {
  buildAvatarVariants,
  clubAvatarObjectKey,
} from "@/shared/images/avatar-image";
import {
  SCALEWAY_OBJECT_STORAGE,
  ScalewayObjectStorage,
} from "@/shared/storage/scaleway-object-storage";

import { ClubAccess } from "../lib/club-access";
import {
  ClubAvatarsRepository,
  type ClubAvatarSlots,
} from "../repositories/club-avatars.repository";
import {
  ClubDetailAssembler,
  type ClubAvatarsSigned,
} from "./create-club";

export type AvatarUploadFile = {
  buffer: Buffer;
  mimetype?: string;
  size: number;
};

@Injectable()
export class UpdateClubAvatars {
  private readonly logger = new Logger(UpdateClubAvatars.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(ClubAvatarsRepository)
    private readonly avatarsRepository: ClubAvatarsRepository,
    @Inject(SCALEWAY_OBJECT_STORAGE)
    private readonly storage: ScalewayObjectStorage,
    @Inject(ClubDetailAssembler)
    private readonly assembler: ClubDetailAssembler,
  ) {}

  async execute(
    clubId: number,
    userId: string,
    avatar: AvatarUploadFile,
  ): Promise<ClubAvatarsSigned> {
    await this.access.requireAdmin(clubId, userId);

    if (!avatar?.buffer?.length) {
      throw new ValidationError("avatar file is required");
    }

    const existing = await this.avatarsRepository.findByClubId(this.db, clubId);
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

    const row = await this.avatarsRepository.upsertSlots(this.db, clubId, keys);
    await this.deletePreviousObjects(existing);
    return this.assembler.signAvatars(row);
  }

  private async deletePreviousObjects(
    existing: ClubAvatarSlots | null,
  ): Promise<void> {
    if (!existing) {
      return;
    }
    const previousKeys = [
      existing.avatar1,
      existing.avatar2,
      existing.avatar3,
    ].filter((key): key is string => Boolean(key));

    await Promise.all(
      previousKeys.map(async (key) => {
        try {
          await this.storage.deleteObject(key);
        } catch (error) {
          this.logger.warn(
            `Failed to delete previous club avatar object ${key}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }),
    );
  }
}

@Injectable()
export class GetClubAvatars {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(ClubAvatarsRepository)
    private readonly avatarsRepository: ClubAvatarsRepository,
    @Inject(ClubDetailAssembler)
    private readonly assembler: ClubDetailAssembler,
  ) {}

  async execute(clubId: number, userId: string): Promise<ClubAvatarsSigned> {
    await this.access.requireMember(clubId, userId);
    const row = await this.avatarsRepository.findByClubId(this.db, clubId);
    return this.assembler.signAvatars(row);
  }
}
