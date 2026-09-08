import { hash, verify, type Options } from "@node-rs/argon2";

/** Argon2id = 2 (library default; set explicitly without importing const enum). */
const argon2idOptions: Options = {
  algorithm: 2,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, argon2idOptions);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password, argon2idOptions);
}
