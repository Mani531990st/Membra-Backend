import { db } from "@/db";
import { UnauthorizedError } from "@/shared/errors";

import {
  createSessionCookieForUser,
  LOGIN_SESSION_TTL_MS,
  toSafeUser,
} from "../lib/auth-helpers";
import { authRepository } from "../repositories/auth.repository";
import type { LoginInput } from "../schemas/auth.schema";
import { verifyPassword } from "../services/password-hasher";
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

    await createSessionCookieForUser(user.uuid, {
      ttlMs: input.rememberMe
        ? LOGIN_SESSION_TTL_MS.rememberMe
        : LOGIN_SESSION_TTL_MS.default,
    });

    return { user: toSafeUser(user) };
  }
}

export const login = new Login();
