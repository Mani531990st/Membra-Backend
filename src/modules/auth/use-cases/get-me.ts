import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { UnauthorizedError } from "@/shared/errors";

import { toSafeUser } from "../lib/auth-helpers";
import { AuthRepository } from "../repositories/auth.repository";
import type { SafeAuthUser } from "../types/auth.types";

@Injectable()
export class GetMe {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  async execute(userId: string): Promise<{ user: SafeAuthUser }> {
    const user = await this.authRepository.findSafeUserById(this.db, userId);
    if (!user) {
      throw new UnauthorizedError();
    }

    return { user: toSafeUser(user) };
  }
}
