import { Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";

import type { DbOrTx } from "@/db";
import { userAvatarsInApp } from "@/db/schema";

export type UserAvatarSlots = {
  avatar1: string | null;
  avatar2: string | null;
  avatar3: string | null;
};

export type UserAvatarSlotUpdate = {
  avatar1?: string;
  avatar2?: string;
  avatar3?: string;
};

@Injectable()
export class UserAvatarsRepository {
  async findByUserId(
    dbOrTx: DbOrTx,
    userId: string,
  ): Promise<UserAvatarSlots | null> {
    const [row] = await dbOrTx
      .select({
        avatar1: userAvatarsInApp.avatar1,
        avatar2: userAvatarsInApp.avatar2,
        avatar3: userAvatarsInApp.avatar3,
      })
      .from(userAvatarsInApp)
      .where(eq(userAvatarsInApp.userId, userId))
      .limit(1);

    return row ?? null;
  }

  async upsertSlots(
    dbOrTx: DbOrTx,
    userId: string,
    slots: UserAvatarSlotUpdate,
  ): Promise<UserAvatarSlots> {
    const [row] = await dbOrTx
      .insert(userAvatarsInApp)
      .values({
        userId,
        avatar1: slots.avatar1 ?? null,
        avatar2: slots.avatar2 ?? null,
        avatar3: slots.avatar3 ?? null,
      })
      .onConflictDoUpdate({
        target: userAvatarsInApp.userId,
        set: {
          ...(slots.avatar1 !== undefined ? { avatar1: slots.avatar1 } : {}),
          ...(slots.avatar2 !== undefined ? { avatar2: slots.avatar2 } : {}),
          ...(slots.avatar3 !== undefined ? { avatar3: slots.avatar3 } : {}),
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning({
        avatar1: userAvatarsInApp.avatar1,
        avatar2: userAvatarsInApp.avatar2,
        avatar3: userAvatarsInApp.avatar3,
      });

    if (!row) {
      throw new Error("Failed to upsert user avatars");
    }

    return row;
  }
}
