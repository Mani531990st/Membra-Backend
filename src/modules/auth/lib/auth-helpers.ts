import type { AuthUserRow, SafeAuthUser } from "../types/auth.types";

export const MAX_ACTIVE_SESSIONS = 5;

export const LOGIN_SESSION_TTL_MS = {
  default: 24 * 60 * 60 * 1000,
  rememberMe: 7 * 24 * 60 * 60 * 1000,
} as const;

export function isProfileComplete(row: AuthUserRow): boolean {
  return Boolean(
    row.firstname &&
      row.surname &&
      row.nickname &&
      row.dob &&
      row.genderId &&
      row.preferredLang,
  );
}

export function toSafeUser(row: AuthUserRow): SafeAuthUser {
  return {
    uuid: row.uuid,
    email: row.email,
    firstname: row.firstname,
    surname: row.surname,
    nickname: row.nickname,
    dob: row.dob,
    genderId: row.genderId,
    preferredLang: row.preferredLang,
    profileComplete: isProfileComplete(row),
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
