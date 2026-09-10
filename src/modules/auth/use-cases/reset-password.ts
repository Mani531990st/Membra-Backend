import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { ValidationError } from "@/shared/errors";

import { toIsoTimestamp } from "../lib/auth-helpers";
import { AuthRepository } from "../repositories/auth.repository";
import { SessionRepository } from "../repositories/session.repository";
import type { ResetPasswordInput } from "../schemas/auth.schema";
import { PasswordHasher } from "../services/password-hasher";
import { hashToken } from "../services/token";

@Injectable()
export class ResetPassword {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(SessionRepository)
    private readonly sessionRepository: SessionRepository,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordInput): Promise<{ message: string }> {
    const tokenHash = hashToken(input.token);
    const nowIso = toIsoTimestamp(new Date());
    const passwordHash = await this.passwordHasher.hash(input.password);

    await this.db.transaction(async (tx) => {
      const reset = await this.authRepository.consumeValidResetByTokenHash(
        tx,
        tokenHash,
        nowIso,
      );

      if (!reset) {
        throw new ValidationError("Invalid or expired reset token");
      }

      await this.authRepository.updatePasswordHash(
        tx,
        reset.userId,
        passwordHash,
      );
      await this.sessionRepository.revokeAllForUser(tx, reset.userId);
    });

    return { message: "Password has been reset successfully" };
  }
}
