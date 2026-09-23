import { ValidationError } from "@/shared/errors";

/**
 * Multer/express leaves multipart text fields as strings (or string[]).
 * Coerce into a plain object suitable for CreateClubSchema.
 */
export function parseCreateClubMultipartBody(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const get = (key: string): unknown => {
    const value = body[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const result: Record<string, unknown> = {};

  const name = get("name");
  if (name !== undefined) result.name = name;

  const shortName = get("shortName");
  if (shortName !== undefined) result.shortName = shortName;

  const establishedDate = get("establishedDate");
  if (establishedDate !== undefined && establishedDate !== "") {
    result.establishedDate = establishedDate;
  } else if (establishedDate === "" || establishedDate === null) {
    result.establishedDate = null;
  }

  const active = get("active");
  if (active !== undefined) {
    result.active = coerceBoolean(active, "active");
  }

  const activityIds = get("activityIds");
  if (activityIds !== undefined) {
    result.activityIds = parseActivityIds(activityIds);
  }

  const languages = get("languages");
  if (languages !== undefined) {
    result.languages = parseLanguages(languages);
  }

  const addresses = get("addresses");
  if (addresses !== undefined) {
    result.addresses = parseAddresses(addresses);
  }

  return result;
}

function coerceBoolean(value: unknown, field: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  throw new ValidationError(`Invalid boolean for ${field}`);
}

/**
 * Accepts:
 * - JSON array: [1,2]
 * - Comma-separated: 1,2
 * - Single id: 1
 * - Already an array
 */
function parseActivityIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((id, index) => toPositiveInt(id, `activityIds[${index}]`));
  }

  if (typeof value === "number") {
    return [toPositiveInt(value, "activityIds")];
  }

  if (typeof value !== "string") {
    throw new ValidationError(
      "activityIds must be a JSON array like [1,2] or comma-separated like 1,2",
    );
  }

  let trimmed = value.trim();
  if (trimmed === "") {
    return [];
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((id, index) =>
        toPositiveInt(id, `activityIds[${index}]`),
      );
    }
    if (typeof parsed === "number") {
      return [toPositiveInt(parsed, "activityIds")];
    }
    if (typeof parsed === "string") {
      return parseActivityIds(parsed);
    }
  } catch {
    // Fall through to comma-separated
  }

  if (/^[\d,\s]+$/.test(trimmed)) {
    return trimmed
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part, index) => toPositiveInt(part, `activityIds[${index}]`));
  }

  throw new ValidationError(
    "activityIds must be valid JSON like [1,2] or comma-separated like 1,2",
  );
}

/**
 * Accepts JSON array of { languageId, rank }, or already-parsed array.
 */
function parseLanguages(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  let trimmed = value.trim();
  if (trimmed === "") {
    return [];
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new ValidationError(
      'languages must be valid JSON like [{"languageId":"da","rank":1}]',
    );
  }
}

/**
 * Accepts JSON array of address objects, or already-parsed array.
 */
function parseAddresses(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  let trimmed = value.trim();
  if (trimmed === "") {
    return [];
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new ValidationError(
      'addresses must be valid JSON like [{"streetName":"Lyngbyvej","streetNumber":"1","zip":"2100","city":"Copenhagen","name":"Main hall","shortName":"MH"}]',
    );
  }
}

function toPositiveInt(value: unknown, field: string): number {
  const n =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${field} must be a positive integer`);
  }
  return n;
}
