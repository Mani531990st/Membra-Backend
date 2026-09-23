import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { AuthRepository } from "../repositories/auth.repository";

@Injectable()
export class ListStatuses {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  async execute(): Promise<{
    statuses: { id: number; status: string }[];
  }> {
    const statuses = await this.authRepository.listStatuses(this.db);
    return { statuses };
  }
}
