import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import type { DbOrTx } from "@/db";
import {
  gendersInApp,
  passwordResetTokensInApp,
  userCredentialsInApp,
  userEmailsInApp,
  usersInApp,
} from "@/db/schema";

import type { AuthUserRow, GenderEnum } from "../types/auth.types";

function mapAuthUser(row: {
  uuid: string;
  firstname: string;
  surname: string;
  nickname: string;
  dob: string;
  gender: number;
  preferredLang: string;
  email: string | null;
  genderEnum: GenderEnum;
  passwordHash: string | null;
}): AuthUserRow | null {
  if (!row.email) {
    return null;
  }

  return {
    uuid: row.uuid,
    firstname: row.firstname,
    surname: row.surname,
    nickname: row.nickname,
    dob: row.dob,
    gender: row.gender,
    preferredLang: row.preferredLang,
    email: row.email,
    genderEnum: row.genderEnum,
    passwordHash: row.passwordHash,
  };
}

export class AuthRepository {
  async findGenderById(
    dbOrTx: DbOrTx,
    genderId: number,
  ): Promise<{ id: number; gender: GenderEnum } | null> {
    const [row] = await dbOrTx
      .select({ id: gendersInApp.id, gender: gendersInApp.gender })
      .from(gendersInApp)
      .where(eq(gendersInApp.id, genderId))
      .limit(1);

    return row ?? null;
  }

  /**
   * Resolve login / forgot-password by normalized email where active IS TRUE.
   * primary is not required (email is globally unique).
   */
  async findActiveUserByNormalizedEmail(
    dbOrTx: DbOrTx,
    email: string,
  ): Promise<AuthUserRow | null> {
    const [row] = await dbOrTx
      .select({
        uuid: usersInApp.uuid,
        firstname: usersInApp.firstname,
        surname: usersInApp.surname,
        nickname: usersInApp.nickname,
        dob: usersInApp.dob,
        gender: usersInApp.gender,
        preferredLang: usersInApp.preferredLang,
        email: userEmailsInApp.email,
        genderEnum: gendersInApp.gender,
        passwordHash: userCredentialsInApp.passwordHash,
      })
      .from(userEmailsInApp)
      .innerJoin(usersInApp, eq(userEmailsInApp.userId, usersInApp.uuid))
      .innerJoin(gendersInApp, eq(usersInApp.gender, gendersInApp.id))
      .leftJoin(
        userCredentialsInApp,
        eq(userCredentialsInApp.userId, usersInApp.uuid),
      )
      .where(
        and(eq(userEmailsInApp.email, email), eq(userEmailsInApp.active, true)),
      )
      .limit(1);

    return row ? mapAuthUser(row) : null;
  }

  /**
   * Load profile for an authenticated session.
   * Requires an active email; prefers primary when multiple exist.
   */
  async findSafeUserById(
    dbOrTx: DbOrTx,
    userId: string,
  ): Promise<AuthUserRow | null> {
    const [row] = await dbOrTx
      .select({
        uuid: usersInApp.uuid,
        firstname: usersInApp.firstname,
        surname: usersInApp.surname,
        nickname: usersInApp.nickname,
        dob: usersInApp.dob,
        gender: usersInApp.gender,
        preferredLang: usersInApp.preferredLang,
        email: userEmailsInApp.email,
        genderEnum: gendersInApp.gender,
      })
      .from(usersInApp)
      .innerJoin(gendersInApp, eq(usersInApp.gender, gendersInApp.id))
      .innerJoin(
        userEmailsInApp,
        and(
          eq(userEmailsInApp.userId, usersInApp.uuid),
          eq(userEmailsInApp.active, true),
        ),
      )
      .where(eq(usersInApp.uuid, userId))
      .orderBy(desc(userEmailsInApp.primary))
      .limit(1);

    if (!row) {
      return null;
    }

    return mapAuthUser({ ...row, passwordHash: null });
  }

  async emailExists(dbOrTx: DbOrTx, email: string): Promise<boolean> {
    const [row] = await dbOrTx
      .select({ id: userEmailsInApp.id })
      .from(userEmailsInApp)
      .where(eq(userEmailsInApp.email, email))
      .limit(1);

    return Boolean(row);
  }

  async insertUser(
    dbOrTx: DbOrTx,
    input: {
      firstname: string;
      surname: string;
      nickname: string;
      dob: string;
      genderId: number;
      preferredLang: string;
    },
  ): Promise<{ uuid: string }> {
    const [row] = await dbOrTx
      .insert(usersInApp)
      .values({
        firstname: input.firstname,
        surname: input.surname,
        nickname: input.nickname,
        dob: input.dob,
        gender: input.genderId,
        preferredLang: input.preferredLang,
      })
      .returning({ uuid: usersInApp.uuid });

    if (!row) {
      throw new Error("Failed to insert user");
    }

    return row;
  }

  async insertUserEmail(
    dbOrTx: DbOrTx,
    input: { userId: string; email: string },
  ): Promise<void> {
    await dbOrTx.insert(userEmailsInApp).values({
      userId: input.userId,
      email: input.email,
      primary: true,
      active: true,
    });
  }

  async insertCredentials(
    dbOrTx: DbOrTx,
    input: { userId: string; passwordHash: string },
  ): Promise<void> {
    await dbOrTx.insert(userCredentialsInApp).values({
      userId: input.userId,
      passwordHash: input.passwordHash,
    });
  }

  async updatePasswordHash(
    dbOrTx: DbOrTx,
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await dbOrTx
      .update(userCredentialsInApp)
      .set({
        passwordHash,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(userCredentialsInApp.userId, userId));
  }

  async invalidateUnusedResetTokensForUser(
    dbOrTx: DbOrTx,
    userId: string,
  ): Promise<void> {
    await dbOrTx
      .update(passwordResetTokensInApp)
      .set({ consumedAt: sql`CURRENT_TIMESTAMP` })
      .where(
        and(
          eq(passwordResetTokensInApp.userId, userId),
          isNull(passwordResetTokensInApp.consumedAt),
        ),
      );
  }

  async insertResetToken(
    dbOrTx: DbOrTx,
    input: { userId: string; tokenHash: string; expiresAt: string },
  ): Promise<void> {
    await dbOrTx.insert(passwordResetTokensInApp).values({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    });
  }

  async findValidResetByTokenHash(
    dbOrTx: DbOrTx,
    tokenHash: string,
    nowIso: string,
  ): Promise<{ id: number; userId: string } | null> {
    const [row] = await dbOrTx
      .select({
        id: passwordResetTokensInApp.id,
        userId: passwordResetTokensInApp.userId,
      })
      .from(passwordResetTokensInApp)
      .where(
        and(
          eq(passwordResetTokensInApp.tokenHash, tokenHash),
          isNull(passwordResetTokensInApp.consumedAt),
          gt(passwordResetTokensInApp.expiresAt, nowIso),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async consumeResetToken(dbOrTx: DbOrTx, resetTokenId: number): Promise<void> {
    await dbOrTx
      .update(passwordResetTokensInApp)
      .set({ consumedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(passwordResetTokensInApp.id, resetTokenId));
  }
}

export const authRepository = new AuthRepository();
