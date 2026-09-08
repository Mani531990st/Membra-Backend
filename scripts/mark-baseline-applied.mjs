import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import postgres from "postgres";

function encodeDatabaseUrl(raw) {
  const cleaned = raw.replace(/^"|"$/g, "");
  try {
    // URL parses successfully only if special chars are already encoded
    // or password has no reserved characters.
    const parsed = new URL(cleaned);
    if (parsed.password.includes("@") || cleaned.includes(":@")) {
      // unlikely path
    }
    // Detect mis-parsed host when password contains unencoded @
    if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      // fall through to manual parse
    } else {
      return cleaned;
    }
  } catch {
    // manual parse below
  }

  const match = cleaned.match(
    /^(postgresql:\/\/|postgres:\/\/)([^:]+):(.+)@([^:/]+)(?::(\d+))?\/(.+)$/,
  );
  if (!match) {
    throw new Error("Cannot parse DATABASE_URL");
  }
  const [, protocol, user, password, host, port, database] = match;
  const portPart = port ? `:${port}` : "";
  return `${protocol}${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}${portPart}/${database}`;
}

const raw = process.env.DATABASE_URL;
if (!raw) {
  throw new Error("DATABASE_URL is not set");
}

const url = encodeDatabaseUrl(raw);
const redacted = url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
console.log("Connecting:", redacted);

const sql = postgres(url, { max: 1 });

const migrationSql = fs.readFileSync(
  "drizzle/migrations/0000_baseline.sql",
  "utf8",
);
const hash = crypto.createHash("sha256").update(migrationSql).digest("hex");
const journal = JSON.parse(
  fs.readFileSync("drizzle/migrations/meta/_journal.json", "utf8"),
);
const when = journal.entries[0].when;

await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
await sql`
  CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )
`;

const existing = await sql`
  SELECT id, hash, created_at
  FROM drizzle.__drizzle_migrations
  WHERE hash = ${hash}
`;

if (existing.length > 0) {
  console.log("Baseline already marked as applied:", existing[0]);
} else {
  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${when})
  `;
  console.log("Marked baseline applied:", { hash, created_at: when });
}

const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'app'
  ORDER BY table_name
`;
console.log("app tables:", tables.length);
console.log(tables.map((t) => t.table_name).join(", "));

await sql.end();
