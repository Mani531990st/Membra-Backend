import "dotenv/config";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { colorsInApp } from "../src/db/schema";

const COLORS = [
  {
    id: 1,
    color: "blue1",
    hex: "#88a1bc",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 2,
    color: "blue2",
    hex: "#68849e",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 3,
    color: "brown1",
    hex: "#bca388",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 4,
    color: "brown2",
    hex: "#9a836e",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 5,
    color: "green1",
    hex: "#9db77e",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 6,
    color: "green2",
    hex: "#73a172",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 7,
    color: "grey1",
    hex: "#d0d0d0",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 8,
    color: "grey2",
    hex: "#959595",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 9,
    color: "magenta1",
    hex: "#bc88bb",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 10,
    color: "magenta2",
    hex: "#9d689e",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 11,
    color: "orange",
    hex: "#ceb17f",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 12,
    color: "pink1",
    hex: "#c7a2b0",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 13,
    color: "pink2",
    hex: "#b4799b",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 14,
    color: "purple1",
    hex: "#a387c0",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 15,
    color: "purple2",
    hex: "#a6a2c7",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 16,
    color: "purple3",
    hex: "#7e79b4",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 17,
    color: "purple4",
    hex: "#836e9a",
    isPublic: true,
    isTextBlack: true,
  },
  { id: 18, color: "red", hex: "#c08787", isPublic: true, isTextBlack: true },
  {
    id: 19,
    color: "turquoise",
    hex: "#7eb7b5",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 20,
    color: "yellow1",
    hex: "#d7d694",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 21,
    color: "yellow2",
    hex: "#b4b079",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 22,
    color: "black",
    hex: "#000000",
    isPublic: true,
    isTextBlack: false,
  },
  {
    id: 23,
    color: "white",
    hex: "#ffffff",
    isPublic: true,
    isTextBlack: true,
  },
  {
    id: 24,
    color: "green101",
    hex: "#b8d8be",
    isPublic: false,
    isTextBlack: true,
  },
  {
    id: 25,
    color: "grey102",
    hex: "#a6a6a6",
    isPublic: false,
    isTextBlack: true,
  },
  {
    id: 26,
    color: "blue101",
    hex: "#0e2841",
    isPublic: false,
    isTextBlack: false,
  },
] as const;

async function seedColors(): Promise<void> {
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
      .insert(colorsInApp)
      .values(COLORS.map((row) => ({ ...row, active: true })))
      .onConflictDoNothing({ target: colorsInApp.color })
      .returning({
        id: colorsInApp.id,
        color: colorsInApp.color,
        hex: colorsInApp.hex,
      });

    await db.execute(
      sql`SELECT setval(pg_get_serial_sequence('app.colors', 'id'), COALESCE((SELECT MAX(id) FROM app.colors), 1))`,
    );

    const all = await db
      .select({
        id: colorsInApp.id,
        color: colorsInApp.color,
        hex: colorsInApp.hex,
        isPublic: colorsInApp.isPublic,
        isTextBlack: colorsInApp.isTextBlack,
        active: colorsInApp.active,
      })
      .from(colorsInApp)
      .orderBy(colorsInApp.id);

    console.log(
      `Seeded colors: inserted ${inserted.length} new row(s); ${all.length} total.`,
    );
    for (const row of all) {
      console.log(
        `  id=${row.id} color=${row.color} hex=${row.hex} isPublic=${row.isPublic} isTextBlack=${row.isTextBlack} active=${row.active}`,
      );
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

seedColors().catch((error: unknown) => {
  console.error("Colors seed failed:", error);
  process.exit(1);
});
