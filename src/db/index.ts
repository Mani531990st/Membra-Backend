import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
};

function createPostgresClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment before using the database.",
    );
  }

  const lower = databaseUrl.toLowerCase();
  if (lower.includes("-pooler.") || lower.includes("pgbouncer")) {
    console.warn(
      "[db] DATABASE_URL looks like a transaction-mode pooler. Session capping uses SELECT … FOR UPDATE and needs a direct or session-mode connection.",
    );
  }

  return postgres(databaseUrl, {
    // NestJS is a long-running process; allow a small pool.
    max: 10,
    // Disable prepared statements for compatibility with connection poolers
    // (e.g. PgBouncer transaction mode, Neon, Supabase pooler).
    prepare: false,
  });
}

const client = globalForDb.postgresClient ?? createPostgresClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const postgresClient = client;

export const db = drizzle(client, { schema });

export async function closeDatabase(): Promise<void> {
  await client.end({ timeout: 5 });
}

export type { Database, DbOrTx, DbTransaction } from "./types";
