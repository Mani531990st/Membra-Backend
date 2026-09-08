import { db } from "@/db";
import { UnauthorizedError } from "@/shared/errors";

import { toIsoTimestamp, toSafeUser } from "../lib/auth-helpers";
import { authRepository } from "../repositories/auth.repository";
import { sessionRepository } from "../repositories/session.repository";
import type { LoginInput } from "../schemas/auth.schema";
import { verifyPassword } from "../services/password-hasher";
import {
  getSessionTtlDays,
  setSessionCookie,
} from "../services/session-cookie";
import { generateOpaqueToken, hashToken } from "../services/token";
import type { SafeAuthUser } from "../types/auth.types";

const INVALID_CREDENTIALS = "Invalid email or password";

export class Login {
  async execute(input: LoginInput): Promise<{ user: SafeAuthUser }> {
    const user = await authRepository.findActiveUserByNormalizedEmail(
      db,
      input.email,
    );

    if (!user?.passwordHash) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    const passwordOk = await verifyPassword(user.passwordHash, input.password);
    if (!passwordOk) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    const rawToken = generateOpaqueToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + getSessionTtlDays());

    await sessionRepository.createSession(db, {
      userId: user.uuid,
      tokenHash,
      expiresAt: toIsoTimestamp(expiresAt),
    });

    await setSessionCookie(rawToken, expiresAt);

    return { user: toSafeUser(user) };
  }
}

export const login = new Login();
