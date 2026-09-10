import { hash, verify, type Options } from "@node-rs/argon2";
import { Injectable } from "@nestjs/common";

/** OWASP Argon2id minimums (19 MiB, 2 iterations, 1 lane). Algorithm 2 = argon2id. */
const argon2idOptions: Options = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const DUMMY_PASSWORD = "membra-timing-dummy-not-a-real-password";

let dummyHashPromise: Promise<string> | undefined;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, argon2idOptions);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password, argon2idOptions);
}

async function dummyPasswordHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(DUMMY_PASSWORD);
  return dummyHashPromise;
}

/** Always runs Argon2 so missing users take the same time as bad passwords. */
export async function verifyLoginPassword(
  passwordHash: string | null | undefined,
  password: string,
): Promise<boolean> {
  if (passwordHash) {
    return verifyPassword(passwordHash, password);
  }
  await verifyPassword(await dummyPasswordHash(), password);
  return false;
}

@Injectable()
export class PasswordHasher {
  hash(password: string): Promise<string> {
    return hashPassword(password);
  }

  verifyLogin(
    passwordHash: string | null | undefined,
    password: string,
  ): Promise<boolean> {
    return verifyLoginPassword(passwordHash, password);
  }
}
