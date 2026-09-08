import { db } from "@/db";

import { requireValidSession, toIsoTimestamp } from "../lib/auth-helpers";
import { sessionRepository } from "../repositories/session.repository";
import type { ActiveSession } from "../schemas/auth.schema";

export class ListActiveSessions {
  async execute(): Promise<{ sessions: ActiveSession[] }> {
    const current = await requireValidSession();
    const nowIso = toIsoTimestamp(new Date());

    const rows = await sessionRepository.listActiveSessions(
      db,
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

export const listActiveSessions = new ListActiveSessions();
