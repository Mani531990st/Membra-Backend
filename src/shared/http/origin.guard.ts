import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { ForbiddenError } from "@/shared/errors";

import { isAllowedOrigin } from "./origins";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Browser CSRF mitigation for cookie-authenticated mutating requests.
 * Non-browser clients that omit Origin are allowed; a present Origin must match
 * APP_BASE_URL / CORS_ORIGINS.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      return true;
    }

    const origin = req.headers.origin;
    if (!origin) {
      return true;
    }

    if (!isAllowedOrigin(origin)) {
      throw new ForbiddenError("Invalid origin");
    }

    return true;
  }
}
