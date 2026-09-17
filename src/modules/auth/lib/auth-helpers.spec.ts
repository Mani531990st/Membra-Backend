import { describe, expect, it } from "vitest";

import { isProfileComplete, toSafeUser } from "./auth-helpers";
import type { AuthUserRow } from "../types/auth.types";

const base: AuthUserRow = {
  uuid: "01936a2f-8c4a-7b2e-9f1d-4a5b6c7d8e9f",
  email: "ada@example.com",
  firstname: "Ada",
  surname: "Lovelace",
  nickname: "Ada",
  dob: "1815-12-10",
  genderId: 1,
  genderEnum: "female",
  preferredLang: "en",
  passwordHash: null,
};

describe("toSafeUser", () => {
  it("marks profileComplete when all profile fields are set", () => {
    const user = toSafeUser(base);
    expect(user.profileComplete).toBe(true);
    expect(user.gender_id).toBe(1);
  });

  it("marks profileComplete false when profile is incomplete", () => {
    expect(
      isProfileComplete({
        ...base,
        firstname: null,
        genderId: null,
      }),
    ).toBe(false);
  });
});
