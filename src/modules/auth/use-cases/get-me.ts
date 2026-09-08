import { db } from "@/db";
import { UnauthorizedError } from "@/shared/errors";

import { toIsoTimestamp, toSafeUser } from "../lib/auth-helpers";
import { authRepository } from "../repositories/auth.repository";
import { sessionRepository } from "../repositories/session.repository";
import {
  clearSessionCookie,
  readSessionCookie,
} from "../services/session-cookie";
import { hashToken } from "../services/token";
import type { SafeAuthUser } from "../types/auth.types";

export class GetMe {
  async execute(): Promise<{ user: SafeAuthUser }> {
    const rawToken = await readSessionCookie();
    if (!rawToken) {
      throw new UnauthorizedError();
    }

    const session = await sessionRepository.findValidSessionByTokenHash(
      db,
      hashToken(rawToken),
      toIsoTimestamp(new Date()),
    );

    if (!session) {
      await clearSessionCookie();
      throw new UnauthorizedError();
    }

    const user = await authRepository.findSafeUserById(db, session.userId);
    if (!user) {
      await clearSessionCookie();
      throw new UnauthorizedError();
    }

    return { user: toSafeUser(user) };
  }
}

export const getMe = new GetMe();
