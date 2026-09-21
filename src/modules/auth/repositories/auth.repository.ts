import { Injectable } from "@nestjs/common";
import { and, asc, eq, gt, isNull, sql } from "drizzle-orm";

import type { DbOrTx } from "@/db/types";
import {
  gendersInApp,
  passwordResetTokensInApp,
  userCredentialsInApp,
  userEmailsInApp,
  userPhoneNumbersInApp,
  usersInApp,
} from "@/db/schema";

import type { AuthUserRow, GenderEnum } from "../types/auth.types";

function mapAuthUser(row: {
  uuid: string;
  firstname: string | null;
  surname: string | null;
  nickname: string | null;
  dob: string | null;
  genderId: number | null;
  preferredLang: string | null;
  email: string | null;
  genderEnum: GenderEnum | null;
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
    genderId: row.genderId,
    preferredLang: row.preferredLang,
    email: row.email,
    genderEnum: row.genderEnum,
    passwordHash: row.passwordHash,
  };
}

@Injectable()
export class AuthRepository {
  async listGenders(
    dbOrTx: DbOrTx,
  ): Promise<{ id: number; gender: GenderEnum }[]> {
    return dbOrTx
      .select({ id: gendersInApp.id, gender: gendersInApp.gender })
      .from(gendersInApp)
      .orderBy(asc(gendersInApp.id));
  }

  async findGenderIdByEnum(
    dbOrTx: DbOrTx,
    gender: GenderEnum,
  ): Promise<number | null> {
    const [row] = await dbOrTx
      .select({ id: gendersInApp.id })
      .from(gendersInApp)
      .where(eq(gendersInApp.gender, gender))
      .limit(1);

    return row?.id ?? null;
  }

  async genderIdExists(dbOrTx: DbOrTx, genderId: number): Promise<boolean> {
    const [row] = await dbOrTx
      .select({ id: gendersInApp.id })
      .from(gendersInApp)
      .where(eq(gendersInApp.id, genderId))
      .limit(1);

    return Boolean(row);
  }

  /**
   * Resolve login / forgot-password by credentials email (auth source of truth).
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
        genderId: usersInApp.genderId,
        preferredLang: usersInApp.preferredLang,
        email: userCredentialsInApp.email,
        genderEnum: gendersInApp.gender,
        passwordHash: userCredentialsInApp.passwordHash,
      })
      .from(userCredentialsInApp)
      .innerJoin(usersInApp, eq(userCredentialsInApp.userId, usersInApp.uuid))
      .leftJoin(gendersInApp, eq(usersInApp.genderId, gendersInApp.id))
      .where(
        and(
          eq(userCredentialsInApp.email, email),
          eq(usersInApp.active, true),
        ),
      )
      .limit(1);

    return row ? mapAuthUser(row) : null;
  }

  /**
   * Load profile for an authenticated session.
   * Email comes from user_credentials (auth source of truth).
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
        genderId: usersInApp.genderId,
        preferredLang: usersInApp.preferredLang,
        email: userCredentialsInApp.email,
        genderEnum: gendersInApp.gender,
      })
      .from(usersInApp)
      .innerJoin(
        userCredentialsInApp,
        eq(userCredentialsInApp.userId, usersInApp.uuid),
      )
      .leftJoin(gendersInApp, eq(usersInApp.genderId, gendersInApp.id))
      .where(eq(usersInApp.uuid, userId))
      .limit(1);

    if (!row) {
      return null;
    }

    return mapAuthUser({ ...row, passwordHash: null });
  }

  async findPrimaryEmail(
    dbOrTx: DbOrTx,
    userId: string,
  ): Promise<string | null> {
    const [row] = await dbOrTx
      .select({ email: userEmailsInApp.email })
      .from(userEmailsInApp)
      .where(
        and(
          eq(userEmailsInApp.userId, userId),
          eq(userEmailsInApp.primary, true),
          eq(userEmailsInApp.active, true),
        ),
      )
      .orderBy(asc(userEmailsInApp.id))
      .limit(1);

    return row?.email ?? null;
  }

  async findPrimaryPhone(
    dbOrTx: DbOrTx,
    userId: string,
  ): Promise<{
    phoneCountryCode: number | null;
    phoneNumber: string | null;
  } | null> {
    const [row] = await dbOrTx
      .select({
        phoneCountryCode: userPhoneNumbersInApp.phoneCountryCode,
        phoneNumber: userPhoneNumbersInApp.phoneNumber,
      })
      .from(userPhoneNumbersInApp)
      .where(
        and(
          eq(userPhoneNumbersInApp.userId, userId),
          eq(userPhoneNumbersInApp.primary, true),
          eq(userPhoneNumbersInApp.active, true),
        ),
      )
      .orderBy(asc(userPhoneNumbersInApp.id))
      .limit(1);

    return row ?? null;
  }

  async emailExists(dbOrTx: DbOrTx, email: string): Promise<boolean> {
    const [row] = await dbOrTx
      .select({ userId: userCredentialsInApp.userId })
      .from(userCredentialsInApp)
      .where(eq(userCredentialsInApp.email, email))
      .limit(1);

    return Boolean(row);
  }

  async insertUser(dbOrTx: DbOrTx): Promise<{ uuid: string }> {
    const [row] = await dbOrTx
      .insert(usersInApp)
      .values({ active: true })
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
    input: { userId: string; email: string; passwordHash: string },
  ): Promise<void> {
    await dbOrTx.insert(userCredentialsInApp).values({
      userId: input.userId,
      email: input.email,
      passwordHash: input.passwordHash,
    });
  }

  async updateUserProfile(
    dbOrTx: DbOrTx,
    userId: string,
    input: {
      firstname: string;
      surname: string;
      nickname: string;
      dob: string;
      genderId: number;
      preferredLang: string;
    },
  ): Promise<void> {
    await dbOrTx
      .update(usersInApp)
      .set({
        firstname: input.firstname,
        surname: input.surname,
        nickname: input.nickname,
        dob: input.dob,
        genderId: input.genderId,
        preferredLang: input.preferredLang,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(usersInApp.uuid, userId));
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

  /**
   * Atomically consume a still-valid reset token.
   * Returns null when the token is missing, expired, or already consumed.
   */
  async consumeValidResetByTokenHash(
    dbOrTx: DbOrTx,
    tokenHash: string,
    nowIso: string,
  ): Promise<{ id: number; userId: string } | null> {
    const [row] = await dbOrTx
      .update(passwordResetTokensInApp)
      .set({ consumedAt: sql`CURRENT_TIMESTAMP` })
      .where(
        and(
          eq(passwordResetTokensInApp.tokenHash, tokenHash),
          isNull(passwordResetTokensInApp.consumedAt),
          gt(passwordResetTokensInApp.expiresAt, nowIso),
        ),
      )
      .returning({
        id: passwordResetTokensInApp.id,
        userId: passwordResetTokensInApp.userId,
      });

    return row ?? null;
  }
}
