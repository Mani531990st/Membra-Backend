import type { CookieOptions, Request, Response } from "express";

const DEFAULT_COOKIE_NAME = "membra_session";

export function getSessionCookieName(): string {
  return process.env.SESSION_COOKIE_NAME?.trim() || DEFAULT_COOKIE_NAME;
}

export function sessionCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export function setSessionCookie(
  res: Response,
  rawToken: string,
  expiresAt: Date,
): void {
  res.cookie(getSessionCookieName(), rawToken, sessionCookieOptions(expiresAt));
}

export function clearSessionCookie(res: Response): void {
  res.cookie(getSessionCookieName(), "", {
    ...sessionCookieOptions(new Date(0)),
    maxAge: 0,
  });
}

export function readSessionCookie(req: Request): string | undefined {
  const value = req.cookies?.[getSessionCookieName()];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
