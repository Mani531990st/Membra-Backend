import { db } from "@/db";

import {
  clearSessionCookie,
  readSessionCookie,
} from "../services/session-cookie";
import { hashToken } from "../services/token";
import { sessionRepository } from "../repositories/session.repository";
import { toIsoTimestamp } from "../lib/auth-helpers";

export class Logout {
  async execute(): Promise<{ message: string }> {
    const rawToken = readSessionCookie();

    if (rawToken) {
      const session = await sessionRepository.findValidSessionByTokenHash(
        db,
        hashToken(rawToken),
        toIsoTimestamp(new Date()),
      );

      if (session) {
        await sessionRepository.revokeSession(db, session.id);
      }
    }

    clearSessionCookie();

    return { message: "Logged out" };
  }
}

export const logout = new Logout();
