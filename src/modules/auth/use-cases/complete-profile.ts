import { db } from "@/db";
import { UnauthorizedError, ValidationError } from "@/shared/errors";

import { toIsoTimestamp, toSafeUser } from "../lib/auth-helpers";
import { authRepository } from "../repositories/auth.repository";
import { sessionRepository } from "../repositories/session.repository";
import type { CompleteProfileInput } from "../schemas/auth.schema";
import {
  clearSessionCookie,
  readSessionCookie,
} from "../services/session-cookie";
import { hashToken } from "../services/token";
import type { SafeAuthUser } from "../types/auth.types";

export class CompleteProfile {
  async execute(
    input: CompleteProfileInput,
  ): Promise<{ user: SafeAuthUser }> {
    const rawToken = readSessionCookie();
    if (!rawToken) {
      throw new UnauthorizedError();
    }

    const session = await sessionRepository.findValidSessionByTokenHash(
      db,
      hashToken(rawToken),
      toIsoTimestamp(new Date()),
    );

    if (!session) {
      clearSessionCookie();
      throw new UnauthorizedError();
    }

    const genderRow = await authRepository.findGenderById(db, input.gender);
    if (!genderRow) {
      throw new ValidationError("Invalid gender id");
    }

    await authRepository.updateUserProfile(db, session.userId, {
      firstname: input.firstname,
      surname: input.surname,
      nickname: input.nickname,
      dob: input.dob,
      genderId: genderRow.id,
      preferredLang: input.preferred_lang,
    });

    const user = await authRepository.findSafeUserById(db, session.userId);
    if (!user) {
      clearSessionCookie();
      throw new UnauthorizedError();
    }

    return { user: toSafeUser(user) };
  }
}

export const completeProfile = new CompleteProfile();
