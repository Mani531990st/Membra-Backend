import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { languagesInApp } from "../src/db/schema";

const LANGUAGES = [
  { code: "da", name: "Danish" },
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
] as const;

async function seedLanguages(): Promise<void> {
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
      .insert(languagesInApp)
      .values(LANGUAGES.map((row) => ({ ...row, active: true })))
      .onConflictDoNothing({ target: languagesInApp.code })
      .returning({
        id: languagesInApp.id,
        code: languagesInApp.code,
        name: languagesInApp.name,
      });

    const all = await db
      .select({
        id: languagesInApp.id,
        code: languagesInApp.code,
        name: languagesInApp.name,
      })
      .from(languagesInApp)
      .orderBy(languagesInApp.id);

    console.log(
      `Seeded languages: inserted ${inserted.length} new row(s); ${all.length} total.`,
    );
    for (const row of all) {
      console.log(`  id=${row.id} code=${row.code} name=${row.name}`);
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

seedLanguages().catch((error: unknown) => {
  console.error("Languages seed failed:", error);
  process.exit(1);
});
