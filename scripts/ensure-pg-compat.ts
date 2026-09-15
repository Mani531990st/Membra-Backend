import "dotenv/config";

import postgres from "postgres";

/**
 * Baseline migrations call uuidv7(), which exists only on PostgreSQL 18+.
 * Scaleway Serverless SQL is older, so provide a compatible default.
 */
async function ensurePgCompat(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment before migrating.",
    );
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    onnotice: () => undefined,
  });

  try {
    const [row] = await sql<{ versionNum: string }[]>`
      select current_setting('server_version_num') as "versionNum"
    `;
    const versionNum = Number.parseInt(row?.versionNum ?? "0", 10);
    if (versionNum >= 180000) {
      return;
    }

    await sql`
      create or replace function uuidv7()
      returns uuid
      language sql
      volatile
      parallel safe
      as $$
        select gen_random_uuid();
      $$
    `;
    console.log(
      `Installed uuidv7() polyfill for PostgreSQL ${versionNum} (gen_random_uuid).`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void ensurePgCompat().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
