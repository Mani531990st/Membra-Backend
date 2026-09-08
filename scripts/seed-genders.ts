import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { gendersInApp } from "../src/db/schema";

const GENDERS = ["male", "female", "others"] as const;

async function seedGenders(): Promise<void> {
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
      .insert(gendersInApp)
      .values(GENDERS.map((gender) => ({ gender })))
      .onConflictDoNothing({ target: gendersInApp.gender })
      .returning({
        id: gendersInApp.id,
        gender: gendersInApp.gender,
      });

    const all = await db
      .select({ id: gendersInApp.id, gender: gendersInApp.gender })
      .from(gendersInApp)
      .orderBy(gendersInApp.id);

    console.log(
      `Seeded genders: inserted ${inserted.length} new row(s); ${all.length} total.`,
    );
    for (const row of all) {
      console.log(`  id=${row.id} gender=${row.gender}`);
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

seedGenders().catch((error: unknown) => {
  console.error("Gender seed failed:", error);
  process.exit(1);
});
