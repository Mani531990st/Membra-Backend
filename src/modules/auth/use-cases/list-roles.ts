import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { AuthRepository } from "../repositories/auth.repository";

@Injectable()
export class ListRoles {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  async execute(): Promise<{
    roles: { id: number; role: string; roleShort: string }[];
  }> {
    const roles = await this.authRepository.listRoles(this.db);
    return { roles };
  }
}
