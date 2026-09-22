import "dotenv/config";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { rolesInApp } from "../src/db/schema";

const ROLES = [
  { id: 1, role: "member", roleShort: "mbr" },
  { id: 2, role: "waitlist", roleShort: "wait" },
  { id: 3, role: "coach", roleShort: "coa" },
  { id: 4, role: "admin", roleShort: "adm" },
  { id: 5, role: "locAdm", roleShort: "loc" },
  { id: 6, role: "dev", roleShort: "dev" },
  { id: 7, role: "sysAdm", roleShort: "sys" },
  { id: 8, role: "support", roleShort: "sup" },
  { id: 9, role: "tryOut", roleShort: "try" },
  { id: 10, role: "passive", roleShort: "pas" },
] as const;

async function seedRoles(): Promise<void> {
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
      .insert(rolesInApp)
      .values(ROLES.map((row) => ({ ...row, active: true })))
      .onConflictDoNothing({ target: rolesInApp.role })
      .returning({
        id: rolesInApp.id,
        role: rolesInApp.role,
        roleShort: rolesInApp.roleShort,
      });

    await db.execute(
      sql`SELECT setval(pg_get_serial_sequence('app.roles', 'id'), COALESCE((SELECT MAX(id) FROM app.roles), 1))`,
    );

    const all = await db
      .select({
        id: rolesInApp.id,
        role: rolesInApp.role,
        roleShort: rolesInApp.roleShort,
        active: rolesInApp.active,
      })
      .from(rolesInApp)
      .orderBy(rolesInApp.id);

    console.log(
      `Seeded roles: inserted ${inserted.length} new row(s); ${all.length} total.`,
    );
    for (const row of all) {
      console.log(
        `  id=${row.id} role=${row.role} roleShort=${row.roleShort} active=${row.active}`,
      );
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

seedRoles().catch((error: unknown) => {
  console.error("Roles seed failed:", error);
  process.exit(1);
});
