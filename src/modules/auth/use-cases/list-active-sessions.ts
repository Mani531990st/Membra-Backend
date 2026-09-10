import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { toIsoTimestamp } from "../lib/auth-helpers";
import { SessionRepository } from "../repositories/session.repository";
import type { ActiveSession } from "../schemas/auth.schema";
import type { AuthSessionContext } from "../types/auth.types";

@Injectable()
export class ListActiveSessions {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(SessionRepository)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    current: AuthSessionContext,
  ): Promise<{ sessions: ActiveSession[] }> {
    const nowIso = toIsoTimestamp(new Date());
    const rows = await this.sessionRepository.listActiveSessions(
      this.db,
      current.userId,
      nowIso,
    );

    return {
      sessions: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        isCurrent: row.id === current.id,
      })),
    };
  }
}
