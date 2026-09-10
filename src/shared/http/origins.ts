function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** Origins allowed for CORS and CSRF Origin checks. */
export function getAllowedOrigins(): string[] {
  const base = stripTrailingSlash(
    process.env.APP_BASE_URL?.trim() || "http://localhost:3000",
  );
  const extra =
    process.env.CORS_ORIGINS?.split(",")
      .map((value) => stripTrailingSlash(value.trim()))
      .filter(Boolean) ?? [];

  return [...new Set([base, ...extra])];
}

export function isAllowedOrigin(origin: string): boolean {
  return getAllowedOrigins().includes(stripTrailingSlash(origin));
}
