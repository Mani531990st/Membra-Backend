import { db } from "@/db";
import { ValidationError } from "@/shared/errors";

import { toIsoTimestamp } from "../lib/auth-helpers";
import { authRepository } from "../repositories/auth.repository";
import { sessionRepository } from "../repositories/session.repository";
import type { ResetPasswordInput } from "../schemas/auth.schema";
import { hashPassword } from "../services/password-hasher";
import { clearSessionCookie } from "../services/session-cookie";
import { hashToken } from "../services/token";

export class ResetPassword {
  async execute(input: ResetPasswordInput): Promise<{ message: string }> {
    const tokenHash = hashToken(input.token);
    const nowIso = toIsoTimestamp(new Date());

    const reset = await authRepository.findValidResetByTokenHash(
      db,
      tokenHash,
      nowIso,
    );

    if (!reset) {
      throw new ValidationError("Invalid or expired reset token");
    }

    const passwordHash = await hashPassword(input.password);

    await db.transaction(async (tx) => {
      await authRepository.updatePasswordHash(tx, reset.userId, passwordHash);
      await authRepository.consumeResetToken(tx, reset.id);
      await sessionRepository.revokeAllForUser(tx, reset.userId);
    });

    await clearSessionCookie();

    return { message: "Password has been reset successfully" };
  }
}

export const resetPassword = new ResetPassword();
