import { db } from "@/db";

import {
  getAppBaseUrl,
  getPasswordResetTtlMinutes,
  toIsoTimestamp,
} from "../lib/auth-helpers";
import { authRepository } from "../repositories/auth.repository";
import type { ForgotPasswordInput } from "../schemas/auth.schema";
import {
  passwordResetMailer,
  type PasswordResetMailer,
} from "../services/password-reset-mailer";
import { generateResetToken, hashToken } from "../services/token";

const GENERIC_MESSAGE =
  "If the account exists, password reset instructions have been sent.";

export class ForgotPassword {
  constructor(private readonly mailer: PasswordResetMailer = passwordResetMailer) {}

  async execute(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await authRepository.findActiveUserByNormalizedEmail(
      db,
      input.email,
    );

    if (user) {
      const rawToken = generateResetToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date();
      expiresAt.setMinutes(
        expiresAt.getMinutes() + getPasswordResetTtlMinutes(),
      );

      // Commit token writes first — never hold the transaction open while mailing.
      await db.transaction(async (tx) => {
        await authRepository.invalidateUnusedResetTokensForUser(tx, user.uuid);
        await authRepository.insertResetToken(tx, {
          userId: user.uuid,
          tokenHash,
          expiresAt: toIsoTimestamp(expiresAt),
        });
      });

      const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
      await this.mailer.sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      });
    }

    return { message: GENERIC_MESSAGE };
  }
}

export const forgotPassword = new ForgotPassword();
