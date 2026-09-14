import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { activitiesInApp } from "../src/db/schema";

const ACTIVITIES = [
  { name: "Beach volleyball", sn: "BV" },
  { name: "Indoor volleyball", sn: "IV" },
  { name: "Football", sn: "FB" },
] as const;

async function seedActivities(): Promise<void> {
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
      .insert(activitiesInApp)
      .values(ACTIVITIES.map((row) => ({ ...row, active: true })))
      .onConflictDoNothing({ target: activitiesInApp.sn })
      .returning({
        id: activitiesInApp.id,
        name: activitiesInApp.name,
        sn: activitiesInApp.sn,
      });

    const all = await db
      .select({
        id: activitiesInApp.id,
        name: activitiesInApp.name,
        sn: activitiesInApp.sn,
      })
      .from(activitiesInApp)
      .orderBy(activitiesInApp.id);

    console.log(
      `Seeded activities: inserted ${inserted.length} new row(s); ${all.length} total.`,
    );
    for (const row of all) {
      console.log(`  id=${row.id} sn=${row.sn} name=${row.name}`);
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

seedActivities().catch((error: unknown) => {
  console.error("Activities seed failed:", error);
  process.exit(1);
});
