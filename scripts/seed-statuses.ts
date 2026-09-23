import "dotenv/config";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { statusesInApp } from "../src/db/schema";

const STATUSES = [
  { id: 1, status: "open" },
  { id: 2, status: "accepted" },
  { id: 3, status: "declined" },
  { id: 4, status: "ignored" },
  { id: 5, status: "blocked" },
  { id: 6, status: "reported" },
  { id: 7, status: "full" },
  { id: 8, status: "waitlist" },
  { id: 9, status: "lateSign" },
  { id: 10, status: "cancelled" },
] as const;

async function seedStatuses(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment before seeding.",
    );
  }

  const client = postgres(databaseUrl, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  try {
    const inserted = await db
      .insert(statusesInApp)
      .values(STATUSES.map((row) => ({ ...row, active: true })))
      .onConflictDoNothing({ target: statusesInApp.status })
      .returning({
        id: statusesInApp.id,
        status: statusesInApp.status,
      });

    await db.execute(
      sql`SELECT setval(pg_get_serial_sequence('app.statuses', 'id'), COALESCE((SELECT MAX(id) FROM app.statuses), 1))`,
    );

    const all = await db
      .select({
        id: statusesInApp.id,
        status: statusesInApp.status,
        active: statusesInApp.active,
      })
      .from(statusesInApp)
      .orderBy(statusesInApp.id);

    console.log(
      `Seeded statuses: inserted ${inserted.length} new row(s); ${all.length} total.`,
    );
    for (const row of all) {
      console.log(
        `  id=${row.id} status=${row.status} active=${row.active}`,
      );
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

seedStatuses().catch((error: unknown) => {
  console.error("Statuses seed failed:", error);
  process.exit(1);
});
