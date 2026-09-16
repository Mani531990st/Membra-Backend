import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { ConflictError } from "@/shared/errors";

import {
  isUniqueViolation,
  LOGIN_SESSION_TTL_MS,
  toSafeUser,
} from "../lib/auth-helpers";
import { AuthRepository } from "../repositories/auth.repository";
import type { SignupInput } from "../schemas/auth.schema";
import { PasswordHasher } from "../services/password-hasher";
import { SessionIssuer } from "../services/session-issuer";
import type { IssuedSession, SafeAuthUser } from "../types/auth.types";

@Injectable()
export class Signup {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(SessionIssuer) private readonly sessionIssuer: SessionIssuer,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    input: SignupInput,
  ): Promise<{ user: SafeAuthUser; session: IssuedSession }> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      const user = await this.db.transaction(async (tx) => {
        if (await this.authRepository.emailExists(tx, input.email)) {
          throw new ConflictError("An account with this email already exists");
        }

        const created = await this.authRepository.insertUser(tx);

        await this.authRepository.insertCredentials(tx, {
          userId: created.uuid,
          email: input.email,
          passwordHash,
        });

        // Contact copy only. Login identity is user_credentials.email.
        await this.authRepository.insertUserEmail(tx, {
          userId: created.uuid,
          email: input.email,
        });

        return {
          uuid: created.uuid,
          email: input.email,
          firstname: null,
          surname: null,
          nickname: null,
          dob: null,
          genderId: null,
          genderEnum: null,
          preferredLang: null,
          passwordHash: null,
        };
      });

      const session = await this.sessionIssuer.issue(
        user.uuid,
        LOGIN_SESSION_TTL_MS.default,
      );

      return { user: toSafeUser(user), session };
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      if (isUniqueViolation(error)) {
        throw new ConflictError("An account with this email already exists");
      }
      throw error;
    }
  }
}
