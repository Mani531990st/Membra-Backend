import { Injectable } from "@nestjs/common";
import { and, asc, eq, gt, isNull, sql } from "drizzle-orm";

import type { DbOrTx } from "@/db/types";
import { authSessionsInApp } from "@/db/schema";

@Injectable()
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

  /**
   * Active sessions for a user, oldest first, locked for update.
   * Caller must be in a transaction. Requires a session-mode Postgres
   * connection (not transaction-mode PgBouncer/Neon pooler).
   */
  async listActiveSessionsForUpdate(
    dbOrTx: DbOrTx,
    userId: string,
    nowIso: string,
  ): Promise<{ id: string }[]> {
    return dbOrTx
      .select({ id: authSessionsInApp.id })
      .from(authSessionsInApp)
      .where(
        and(
          eq(authSessionsInApp.userId, userId),
          isNull(authSessionsInApp.revokedAt),
          gt(authSessionsInApp.expiresAt, nowIso),
        ),
      )
      .orderBy(asc(authSessionsInApp.createdAt))
      .for("update");
  }

  /** Active sessions for a user (read-only list; excludes token hashes). */
  async listActiveSessions(
    dbOrTx: DbOrTx,
    userId: string,
    nowIso: string,
  ): Promise<{ id: string; createdAt: string; expiresAt: string }[]> {
    return dbOrTx
      .select({
        id: authSessionsInApp.id,
        createdAt: authSessionsInApp.createdAt,
        expiresAt: authSessionsInApp.expiresAt,
      })
      .from(authSessionsInApp)
      .where(
        and(
          eq(authSessionsInApp.userId, userId),
          isNull(authSessionsInApp.revokedAt),
          gt(authSessionsInApp.expiresAt, nowIso),
        ),
      )
      .orderBy(asc(authSessionsInApp.createdAt));
  }

  /** Active session owned by userId, or null if missing/revoked/expired/not owned. */
  async findActiveSessionForUser(
    dbOrTx: DbOrTx,
    input: { sessionId: string; userId: string; nowIso: string },
  ): Promise<{ id: string; createdAt: string; expiresAt: string } | null> {
    const [row] = await dbOrTx
      .select({
        id: authSessionsInApp.id,
        createdAt: authSessionsInApp.createdAt,
        expiresAt: authSessionsInApp.expiresAt,
      })
      .from(authSessionsInApp)
      .where(
        and(
          eq(authSessionsInApp.id, input.sessionId),
          eq(authSessionsInApp.userId, input.userId),
          isNull(authSessionsInApp.revokedAt),
          gt(authSessionsInApp.expiresAt, input.nowIso),
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
