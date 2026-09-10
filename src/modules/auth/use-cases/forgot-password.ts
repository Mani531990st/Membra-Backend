import { Inject, Injectable, Logger } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import {
  getAppBaseUrl,
  getPasswordResetTtlMinutes,
  toIsoTimestamp,
} from "../lib/auth-helpers";
import { AuthRepository } from "../repositories/auth.repository";
import type { ForgotPasswordInput } from "../schemas/auth.schema";
import {
  PASSWORD_RESET_MAILER,
  type PasswordResetMailer,
} from "../services/password-reset-mailer";
import { generateResetToken, hashToken } from "../services/token";

const GENERIC_MESSAGE =
  "If the account exists, password reset instructions have been sent.";

@Injectable()
export class ForgotPassword {
  private readonly logger = new Logger(ForgotPassword.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(PASSWORD_RESET_MAILER) private readonly mailer: PasswordResetMailer,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await this.authRepository.findActiveUserByNormalizedEmail(
      this.db,
      input.email,
    );

    if (user) {
      const rawToken = generateResetToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date();
      expiresAt.setMinutes(
        expiresAt.getMinutes() + getPasswordResetTtlMinutes(),
      );

      await this.db.transaction(async (tx) => {
        await this.authRepository.invalidateUnusedResetTokensForUser(
          tx,
          user.uuid,
        );
        await this.authRepository.insertResetToken(tx, {
          userId: user.uuid,
          tokenHash,
          expiresAt: toIsoTimestamp(expiresAt),
        });
      });

      const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
      try {
        await this.mailer.sendPasswordResetEmail({
          to: user.email,
          resetUrl,
        });
      } catch (error) {
        this.logger.error(
          "Failed to send password reset email",
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return { message: GENERIC_MESSAGE };
  }
}
