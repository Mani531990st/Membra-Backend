import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { UnauthorizedError } from "@/shared/errors";

import { toSafeUser } from "../lib/auth-helpers";
import { AuthRepository } from "../repositories/auth.repository";
import type { MeResponse } from "../schemas/auth.schema";
import { GetAvatars } from "./get-avatars";

@Injectable()
export class GetMe {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(GetAvatars) private readonly getAvatars: GetAvatars,
  ) {}

  async execute(userId: string): Promise<MeResponse> {
    const user = await this.authRepository.findSafeUserById(this.db, userId);
    if (!user) {
      throw new UnauthorizedError();
    }

    const [avatars, primaryEmail, primaryPhone] = await Promise.all([
      this.getAvatars.execute(userId),
      this.authRepository.findPrimaryEmail(this.db, userId),
      this.authRepository.findPrimaryPhone(this.db, userId),
    ]);

    return {
      user: toSafeUser(user),
      avatars,
      primaryEmail,
      primaryPhone,
    };
  }
}
