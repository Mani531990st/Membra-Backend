import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { UnauthorizedError } from "@/shared/errors";

import { LOGIN_SESSION_TTL_MS, toSafeUser } from "../lib/auth-helpers";
import { AuthRepository } from "../repositories/auth.repository";
import type { LoginInput } from "../schemas/auth.schema";
import { PasswordHasher } from "../services/password-hasher";
import { SessionIssuer } from "../services/session-issuer";
import type { IssuedSession, SafeAuthUser } from "../types/auth.types";

const INVALID_CREDENTIALS = "Invalid email or password";

@Injectable()
export class Login {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(SessionIssuer) private readonly sessionIssuer: SessionIssuer,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    input: LoginInput,
  ): Promise<{ user: SafeAuthUser; session: IssuedSession }> {
    const user = await this.authRepository.findActiveUserByNormalizedEmail(
      this.db,
      input.email,
    );

    const passwordOk = await this.passwordHasher.verifyLogin(
      user?.passwordHash,
      input.password,
    );
    if (!user || !passwordOk) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    const session = await this.sessionIssuer.issue(
      user.uuid,
      input.rememberMe
        ? LOGIN_SESSION_TTL_MS.rememberMe
        : LOGIN_SESSION_TTL_MS.default,
    );

    return { user: toSafeUser(user), session };
  }
}
