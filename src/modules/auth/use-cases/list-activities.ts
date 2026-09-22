import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { AuthRepository } from "../repositories/auth.repository";

@Injectable()
export class ListActivities {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  async execute(): Promise<{
    activities: { id: number; activity: string }[];
  }> {
    const activities = await this.authRepository.listActivities(this.db);
    return { activities };
  }
}
