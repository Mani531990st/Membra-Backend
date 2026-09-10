import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { NotFoundError } from "@/shared/errors";

import { toIsoTimestamp } from "../lib/auth-helpers";
import { SessionRepository } from "../repositories/session.repository";
import type { LogoutInput } from "../schemas/auth.schema";
import type { AuthSessionContext } from "../types/auth.types";

@Injectable()
export class Logout {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(SessionRepository)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    current: AuthSessionContext,
    input: LogoutInput,
  ): Promise<{ message: string; clearCookie: boolean }> {
    const sessionId = input.sessionId ?? current.id;
    const nowIso = toIsoTimestamp(new Date());

    const target = await this.sessionRepository.findActiveSessionForUser(
      this.db,
      {
        sessionId,
        userId: current.userId,
        nowIso,
      },
    );

    if (!target) {
      throw new NotFoundError("Session not found");
    }

    await this.sessionRepository.revokeSession(this.db, target.id);

    return {
      message: "Logged out",
      clearCookie: target.id === current.id,
    };
  }
}
