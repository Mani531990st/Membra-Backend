import { db } from "@/db";
import { ConflictError, ValidationError } from "@/shared/errors";

import {
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
        const genderId = await authRepository.findGenderIdByEnum(
          tx,
          input.gender,
        );
        if (genderId === null) {
          throw new ValidationError("Invalid gender value");
        }

        if (await authRepository.emailExists(tx, input.email)) {
          throw new ConflictError("An account with this email already exists");
        }

        const created = await authRepository.insertUser(tx, {
          firstname: input.firstname,
          surname: input.surname,
          nickname: input.nickname,
          dob: input.dob,
          genderId,
          preferredLang: input.preferred_lang,
        });

        await authRepository.insertUserEmail(tx, {
          userId: created.uuid,
          email: input.email,
        });

        await authRepository.insertCredentials(tx, {
          userId: created.uuid,
          passwordHash,
        });

        return {
          uuid: created.uuid,
          email: input.email,
          firstname: input.firstname,
          surname: input.surname,
          nickname: input.nickname,
          dob: input.dob,
          gender: genderId,
          genderEnum: input.gender,
          preferredLang: input.preferred_lang,
          passwordHash: null,
        };
      });

      return { user: toSafeUser(user) };
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
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
