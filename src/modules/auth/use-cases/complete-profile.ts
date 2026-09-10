import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { UnauthorizedError, ValidationError } from "@/shared/errors";

import { toSafeUser } from "../lib/auth-helpers";
import { AuthRepository } from "../repositories/auth.repository";
import type { CompleteProfileInput } from "../schemas/auth.schema";
import type { SafeAuthUser } from "../types/auth.types";

@Injectable()
export class CompleteProfile {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  async execute(
    userId: string,
    input: CompleteProfileInput,
  ): Promise<{ user: SafeAuthUser }> {
    const genderId = await this.authRepository.findGenderIdByEnum(
      this.db,
      input.gender,
    );
    if (genderId === null) {
      throw new ValidationError("Invalid gender value");
    }

    await this.authRepository.updateUserProfile(this.db, userId, {
      firstname: input.firstname,
      surname: input.surname,
      nickname: input.nickname,
      dob: input.dob,
      genderId,
      preferredLang: input.preferred_lang,
    });

    const user = await this.authRepository.findSafeUserById(this.db, userId);
    if (!user) {
      throw new UnauthorizedError();
    }

    return { user: toSafeUser(user) };
  }
}
