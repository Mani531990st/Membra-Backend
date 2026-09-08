import { db } from "@/db";
import { ConflictError } from "@/shared/errors";

import {
  createSessionCookieForUser,
  isUniqueViolation,
  toSafeUser,
} from "../lib/auth-helpers";
import { authRepository } from "../repositories/auth.repository";
import type { SignupInput } from "../schemas/auth.schema";
import { hashPassword } from "../services/password-hasher";
import type { SafeAuthUser } from "../types/auth.types";

export class Signup {
  async execute(input: SignupInput): Promise<{ user: SafeAuthUser }> {
    const passwordHash = await hashPassword(input.password);

    try {
      const user = await db.transaction(async (tx) => {
        if (await authRepository.emailExists(tx, input.email)) {
          throw new ConflictError("An account with this email already exists");
        }

        const created = await authRepository.insertUser(tx);

        await authRepository.insertCredentials(tx, {
          userId: created.uuid,
          email: input.email,
          passwordHash,
        });

        await authRepository.insertUserEmail(tx, {
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
          gender: null,
          genderEnum: null,
          preferredLang: null,
          passwordHash: null,
        };
      });

      await createSessionCookieForUser(user.uuid);

      return { user: toSafeUser(user) };
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

export const signup = new Signup();
