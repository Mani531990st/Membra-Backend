import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { AuthRepository } from "../repositories/auth.repository";

@Injectable()
export class ListColors {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  async execute(): Promise<{
    colors: {
      id: number;
      color: string;
      hex: string;
      isPublic: boolean;
      isTextBlack: boolean;
    }[];
  }> {
    const colors = await this.authRepository.listColors(this.db);
    return { colors };
  }
}
