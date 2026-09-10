import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { UnauthorizedError } from "@/shared/errors";

import type { RequestWithAuthSession } from "../guards/session-auth.guard";
import type { AuthSessionContext } from "../types/auth.types";

export const AuthSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSessionContext => {
    const req = ctx.switchToHttp().getRequest<RequestWithAuthSession>();
    if (!req.authSession) {
      throw new UnauthorizedError();
    }
    return req.authSession;
  },
);
