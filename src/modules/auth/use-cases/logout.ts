import { db } from "@/db";
import { NotFoundError } from "@/shared/errors";

import {
  requireValidSession,
  toIsoTimestamp,
} from "../lib/auth-helpers";
import { sessionRepository } from "../repositories/session.repository";
import { clearSessionCookie } from "../services/session-cookie";
import type { LogoutInput } from "../schemas/auth.schema";

export class Logout {
  async execute(input: LogoutInput): Promise<{ message: string }> {
    const current = await requireValidSession();
    const nowIso = toIsoTimestamp(new Date());

    const target = await sessionRepository.findActiveSessionForUser(db, {
      sessionId: input.sessionId,
      userId: current.userId,
      nowIso,
    });

    if (!target) {
      throw new NotFoundError("Session not found");
    }

    await sessionRepository.revokeSession(db, target.id);

    if (target.id === current.id) {
      clearSessionCookie();
    }

    return { message: "Logged out" };
  }
}

export const logout = new Logout();
