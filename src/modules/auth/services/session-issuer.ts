import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { MAX_ACTIVE_SESSIONS, toIsoTimestamp } from "../lib/auth-helpers";
import { SessionRepository } from "../repositories/session.repository";
import { generateOpaqueToken, hashToken } from "./token";
import type { IssuedSession } from "../types/auth.types";

@Injectable()
export class SessionIssuer {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(SessionRepository) private readonly sessions: SessionRepository,
  ) {}

  async issue(userId: string, ttlMs: number): Promise<IssuedSession> {
    const rawToken = generateOpaqueToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.db.transaction(async (tx) => {
      const nowIso = toIsoTimestamp(new Date());
      const active = await this.sessions.listActiveSessionsForUpdate(
        tx,
        userId,
        nowIso,
      );

      const excess = active.length - (MAX_ACTIVE_SESSIONS - 1);
      for (let i = 0; i < excess; i += 1) {
        const session = active[i];
        if (session) {
          await this.sessions.revokeSession(tx, session.id);
        }
      }

      await this.sessions.createSession(tx, {
        userId,
        tokenHash,
        expiresAt: toIsoTimestamp(expiresAt),
      });
    });

    return { rawToken, expiresAt };
  }
}
