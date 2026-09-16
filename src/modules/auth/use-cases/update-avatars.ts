import { randomUUID } from "node:crypto";

import { Inject, Injectable, Logger } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { ValidationError } from "@/shared/errors";
import {
  SCALEWAY_OBJECT_STORAGE,
  ScalewayObjectStorage,
} from "@/shared/storage/scaleway-object-storage";

import {
  avatarObjectKey,
  buildAvatarVariants,
} from "../services/avatar-image";
import {
  UserAvatarsRepository,
  type UserAvatarSlots,
} from "../repositories/user-avatars.repository";

export type AvatarUploadFile = {
  buffer: Buffer;
  mimetype?: string;
  size: number;
};

export type UpdateAvatarsInput = {
  avatar: AvatarUploadFile;
};

export type AvatarsResponse = {
  avatar1: string | null;
  avatar2: string | null;
  avatar3: string | null;
};

@Injectable()
export class UpdateAvatars {
  private readonly logger = new Logger(UpdateAvatars.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(UserAvatarsRepository)
    private readonly avatarsRepository: UserAvatarsRepository,
    @Inject(SCALEWAY_OBJECT_STORAGE)
    private readonly storage: ScalewayObjectStorage,
  ) {}

  async execute(
    userId: string,
    input: UpdateAvatarsInput,
  ): Promise<AvatarsResponse> {
    if (!input.avatar?.buffer?.length) {
      throw new ValidationError("avatar file is required");
    }

    const existing = await this.avatarsRepository.findByUserId(this.db, userId);

    const variants = await buildAvatarVariants(
      input.avatar.buffer,
      input.avatar.mimetype,
    );

    // Opaque asset id so object keys never embed the user primary key.
    const assetId = randomUUID();
    const keys = {
      avatar1: avatarObjectKey(assetId, 1),
      avatar2: avatarObjectKey(assetId, 2),
      avatar3: avatarObjectKey(assetId, 3),
    } as const;

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

    const row = await this.avatarsRepository.upsertSlots(this.db, userId, {
      avatar1: keys.avatar1,
      avatar2: keys.avatar2,
      avatar3: keys.avatar3,
    });

    await this.deletePreviousObjects(existing);

    return this.toSignedResponse(row);
  }

  private async deletePreviousObjects(
    existing: UserAvatarSlots | null,
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
            `Failed to delete previous avatar object ${key}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }),
    );
  }

  private async toSignedResponse(
    row: UserAvatarSlots,
  ): Promise<AvatarsResponse> {
    return {
      avatar1: row.avatar1
        ? await this.storage.getSignedGetUrl(row.avatar1)
        : null,
      avatar2: row.avatar2
        ? await this.storage.getSignedGetUrl(row.avatar2)
        : null,
      avatar3: row.avatar3
        ? await this.storage.getSignedGetUrl(row.avatar3)
        : null,
    };
  }
}
