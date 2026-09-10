import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { AuthRepository } from "../repositories/auth.repository";
import type { GenderEnum } from "../types/auth.types";

@Injectable()
export class ListGenders {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  async execute(): Promise<{
    genders: { id: number; gender: GenderEnum }[];
  }> {
    const genders = await this.authRepository.listGenders(this.db);
    return { genders };
  }
}
