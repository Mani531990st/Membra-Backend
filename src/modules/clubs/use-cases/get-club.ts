import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { ClubAccess } from "../lib/club-access";
import {
  ClubDetailAssembler,
  type ClubDetail,
} from "./create-club";

@Injectable()
export class GetClub {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(ClubDetailAssembler)
    private readonly assembler: ClubDetailAssembler,
  ) {}

  async execute(clubId: number): Promise<ClubDetail> {
    const club = await this.access.requireClub(clubId);
    return this.assembler.assemble(this.db, club);
  }
}
