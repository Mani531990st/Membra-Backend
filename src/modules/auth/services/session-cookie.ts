import { getRequestContext } from "@/shared/http/request-context";

const DEFAULT_COOKIE_NAME = "membra_session";

export function getSessionCookieName(): string {
  return process.env.SESSION_COOKIE_NAME?.trim() || DEFAULT_COOKIE_NAME;
}

export function getSessionTtlDays(): number {
  const raw = process.env.SESSION_TTL_DAYS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 14;
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export function setSessionCookie(rawToken: string, expiresAt: Date): void {
  const { res } = getRequestContext();
  res.cookie(getSessionCookieName(), rawToken, sessionCookieOptions(expiresAt));
}

export function clearSessionCookie(): void {
  const { res } = getRequestContext();
  res.cookie(getSessionCookieName(), "", {
    ...sessionCookieOptions(new Date(0)),
    maxAge: 0,
  });
}

export function readSessionCookie(): string | undefined {
  const { req } = getRequestContext();
  const value = req.cookies?.[getSessionCookieName()];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
