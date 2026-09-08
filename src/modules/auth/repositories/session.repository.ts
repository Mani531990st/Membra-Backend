import { and, eq, gt, isNull, sql } from "drizzle-orm";

import type { DbOrTx } from "@/db";
import { authSessionsInApp } from "@/db/schema";

export class SessionRepository {
  async createSession(
    dbOrTx: DbOrTx,
    input: { userId: string; tokenHash: string; expiresAt: string },
  ): Promise<{ id: string }> {
    const [row] = await dbOrTx
      .insert(authSessionsInApp)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      })
      .returning({ id: authSessionsInApp.id });

    if (!row) {
      throw new Error("Failed to create session");
    }

    return row;
  }

  async findValidSessionByTokenHash(
    dbOrTx: DbOrTx,
    tokenHash: string,
    nowIso: string,
  ): Promise<{ id: string; userId: string } | null> {
    const [row] = await dbOrTx
      .select({
        id: authSessionsInApp.id,
        userId: authSessionsInApp.userId,
      })
      .from(authSessionsInApp)
      .where(
        and(
          eq(authSessionsInApp.tokenHash, tokenHash),
          isNull(authSessionsInApp.revokedAt),
          gt(authSessionsInApp.expiresAt, nowIso),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async revokeSession(dbOrTx: DbOrTx, sessionId: string): Promise<void> {
    await dbOrTx
      .update(authSessionsInApp)
      .set({
        revokedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(authSessionsInApp.id, sessionId));
  }

  async revokeAllForUser(dbOrTx: DbOrTx, userId: string): Promise<void> {
    await dbOrTx
      .update(authSessionsInApp)
      .set({
        revokedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(authSessionsInApp.userId, userId),
          isNull(authSessionsInApp.revokedAt),
        ),
      );
  }
}

export const sessionRepository = new SessionRepository();
