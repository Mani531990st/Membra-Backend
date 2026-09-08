import type { AuthUserRow, SafeAuthUser } from "../types/auth.types";

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
