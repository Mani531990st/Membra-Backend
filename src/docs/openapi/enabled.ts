/**
 * API docs visibility:
 * - ENABLE_API_DOCS=true  → always enabled
 * - ENABLE_API_DOCS=false → always disabled
 * - unset → enabled outside production; disabled in production
 */
export function isApiDocsEnabled(): boolean {
  const flag = process.env.ENABLE_API_DOCS;

  if (flag === "true") {
    return true;
  }

  if (flag === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}
