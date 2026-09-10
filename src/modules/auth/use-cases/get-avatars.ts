import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import {
  SCALEWAY_OBJECT_STORAGE,
  ScalewayObjectStorage,
} from "@/shared/storage/scaleway-object-storage";

import { UserAvatarsRepository } from "../repositories/user-avatars.repository";
import type { AvatarsResponse } from "./update-avatars";

@Injectable()
export class GetAvatars {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(UserAvatarsRepository)
    private readonly avatarsRepository: UserAvatarsRepository,
    @Inject(SCALEWAY_OBJECT_STORAGE)
    private readonly storage: ScalewayObjectStorage,
  ) {}

  async execute(userId: string): Promise<AvatarsResponse> {
    const row = await this.avatarsRepository.findByUserId(this.db, userId);
    if (!row) {
      return { avatar1: null, avatar2: null, avatar3: null };
    }

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
