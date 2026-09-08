import { db, type DbOrTx } from "@/db";
import { UnauthorizedError } from "@/shared/errors";

import type { AuthUserRow, SafeAuthUser } from "../types/auth.types";
import { sessionRepository } from "../repositories/session.repository";
import {
  clearSessionCookie,
  getSessionTtlDays,
  readSessionCookie,
  setSessionCookie,
} from "../services/session-cookie";
import { generateOpaqueToken, hashToken } from "../services/token";

export const MAX_ACTIVE_SESSIONS = 5;

export const LOGIN_SESSION_TTL_MS = {
  default: 24 * 60 * 60 * 1000,
  rememberMe: 7 * 24 * 60 * 60 * 1000,
} as const;

export function toSafeUser(row: AuthUserRow): SafeAuthUser {
  return {
    uuid: row.uuid,
    email: row.email,
    firstname: row.firstname,
    surname: row.surname,
    nickname: row.nickname,
    dob: row.dob,
    gender: row.genderEnum,
    preferred_lang: row.preferredLang,
  };
}

export function getPasswordResetTtlMinutes(): number {
  const raw = process.env.PASSWORD_RESET_TTL_MINUTES;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

export function getAppBaseUrl(): string {
  return (
    process.env.APP_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000"
  );
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export function toIsoTimestamp(date: Date): string {
  return date.toISOString();
}

/** Resolve the caller's valid session from the membra_session cookie, or 401. */
export async function requireValidSession(): Promise<{
  id: string;
  userId: string;
}> {
  const rawToken = readSessionCookie();
  if (!rawToken) {
    throw new UnauthorizedError();
  }

  const session = await sessionRepository.findValidSessionByTokenHash(
    db,
    hashToken(rawToken),
    toIsoTimestamp(new Date()),
  );

  if (!session) {
    clearSessionCookie();
    throw new UnauthorizedError();
  }

  return session;
}

function resolveSessionExpiresAt(ttlMs?: number): Date {
  if (ttlMs !== undefined) {
    return new Date(Date.now() + ttlMs);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + getSessionTtlDays());
  return expiresAt;
}

async function createSessionInDb(
  dbOrTx: DbOrTx,
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  const nowIso = toIsoTimestamp(new Date());
  const active = await sessionRepository.listActiveSessionsForUpdate(
    dbOrTx,
    userId,
    nowIso,
  );

  const excess = active.length - (MAX_ACTIVE_SESSIONS - 1);
  for (let i = 0; i < excess; i += 1) {
    const session = active[i];
    if (session) {
      await sessionRepository.revokeSession(dbOrTx, session.id);
    }
  }

  await sessionRepository.createSession(dbOrTx, {
    userId,
    tokenHash,
    expiresAt: toIsoTimestamp(expiresAt),
  });
}

/** Create a server-side session and set the HTTP-only session cookie. */
export async function createSessionCookieForUser(
  userId: string,
  options?: { ttlMs?: number; dbOrTx?: DbOrTx },
): Promise<void> {
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = resolveSessionExpiresAt(options?.ttlMs);

  if (options?.dbOrTx) {
    await createSessionInDb(options.dbOrTx, userId, tokenHash, expiresAt);
  } else {
    await db.transaction(async (tx) => {
      await createSessionInDb(tx, userId, tokenHash, expiresAt);
    });
  }

  setSessionCookie(rawToken, expiresAt);
}
