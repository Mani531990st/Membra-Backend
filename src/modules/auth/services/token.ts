import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_TOKEN_BYTES = 32;
const RESET_TOKEN_BYTES = 32;

export function generateOpaqueToken(byteLength = SESSION_TOKEN_BYTES): string {
  return randomBytes(byteLength).toString("base64url");
}

export function generateResetToken(): string {
  return generateOpaqueToken(RESET_TOKEN_BYTES);
}

/** Store only the hash of opaque tokens in the database. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
