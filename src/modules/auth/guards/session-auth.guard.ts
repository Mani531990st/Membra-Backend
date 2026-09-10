import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { UnauthorizedError } from "@/shared/errors";

import { toIsoTimestamp } from "../lib/auth-helpers";
import { SessionRepository } from "../repositories/session.repository";
import {
  clearSessionCookie,
  readSessionCookie,
} from "../services/session-cookie";
import { hashToken } from "../services/token";
import type { AuthSessionContext } from "../types/auth.types";

export type RequestWithAuthSession = Request & {
  authSession?: AuthSessionContext;
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(SessionRepository) private readonly sessions: SessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithAuthSession>();
    const res = context.switchToHttp().getResponse<Response>();
    const rawToken = readSessionCookie(req);

    if (!rawToken) {
      throw new UnauthorizedError();
    }

    const session = await this.sessions.findValidSessionByTokenHash(
      this.db,
      hashToken(rawToken),
      toIsoTimestamp(new Date()),
    );

    if (!session) {
      clearSessionCookie(res);
      throw new UnauthorizedError();
    }

    req.authSession = session;
    return true;
  }
}
