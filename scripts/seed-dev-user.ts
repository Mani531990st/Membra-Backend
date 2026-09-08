import "dotenv/config";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import {
  userCredentialsInApp,
  userEmailsInApp,
  usersInApp,
} from "../src/db/schema";
import { hashPassword } from "../src/modules/auth/services/password-hasher";

const DEV_EMAIL = "dev@membra.local";
const DEV_PASSWORD = "dev-password-change-me";

async function seedDevUser(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment before seeding.",
    );
  }

  const client = postgres(databaseUrl, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  try {
    const [existing] = await db
      .select({ userId: userCredentialsInApp.userId })
      .from(userCredentialsInApp)
      .where(eq(userCredentialsInApp.email, DEV_EMAIL))
      .limit(1);

    if (existing) {
      console.log(
        `Dev user already exists (email=${DEV_EMAIL}). Skipping insert.`,
      );
      console.log(`  password=${DEV_PASSWORD}`);
      return;
    }

    const passwordHash = await hashPassword(DEV_PASSWORD);

    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(usersInApp)
        .values({})
        .returning({ uuid: usersInApp.uuid });

      if (!user) {
        throw new Error("Failed to insert dev user");
      }

      await tx.insert(userCredentialsInApp).values({
        userId: user.uuid,
        email: DEV_EMAIL,
        passwordHash,
      });

      await tx.insert(userEmailsInApp).values({
        userId: user.uuid,
        email: DEV_EMAIL,
        primary: true,
        active: true,
      });

      console.log(`Seeded dev user uuid=${user.uuid}`);
    });

    console.log(`  email=${DEV_EMAIL}`);
    console.log(`  password=${DEV_PASSWORD}`);
    console.log("  profile fields: all NULL (complete-profile required)");
  } finally {
    await client.end({ timeout: 5 });
  }
}

seedDevUser().catch((error: unknown) => {
  console.error("Dev user seed failed:", error);
  process.exit(1);
});
