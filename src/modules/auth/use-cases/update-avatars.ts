import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { ValidationError } from "@/shared/errors";
import {
  SCALEWAY_OBJECT_STORAGE,
  ScalewayObjectStorage,
} from "@/shared/storage/scaleway-object-storage";

import {
  avatarObjectKey,
  convertAvatarToAvif,
} from "../services/avatar-image";
import {
  UserAvatarsRepository,
  type UserAvatarSlots,
} from "../repositories/user-avatars.repository";

export type AvatarSlotName = 1 | 2 | 3;

export type AvatarUploadFile = {
  buffer: Buffer;
  mimetype?: string;
  size: number;
};

export type UpdateAvatarsInput = {
  avatar1?: AvatarUploadFile;
  avatar2?: AvatarUploadFile;
  avatar3?: AvatarUploadFile;
};

export type AvatarsResponse = {
  avatar1: string | null;
  avatar2: string | null;
  avatar3: string | null;
};

@Injectable()
export class UpdateAvatars {
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
    const provided = (
      [
        [1, input.avatar1],
        [2, input.avatar2],
        [3, input.avatar3],
      ] as const
    ).filter((entry): entry is [AvatarSlotNumber, AvatarUploadFile] =>
      Boolean(entry[1]),
    );

    if (provided.length === 0) {
      throw new ValidationError(
        "At least one of avatar1, avatar2, or avatar3 is required",
      );
    }

    const slotKeys: { avatar1?: string; avatar2?: string; avatar3?: string } =
      {};

    for (const [slot, file] of provided) {
      const avif = await convertAvatarToAvif(file.buffer, file.mimetype);
      const key = avatarObjectKey(userId, slot);
      await this.storage.putObject({
        key,
        body: avif,
        contentType: "image/avif",
        cacheControl: "private, max-age=3600",
      });
      slotKeys[`avatar${slot}` as const] = key;
    }

    const row = await this.avatarsRepository.upsertSlots(
      this.db,
      userId,
      slotKeys,
    );
    return this.toSignedResponse(row);
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
