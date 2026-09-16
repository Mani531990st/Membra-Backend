import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/shared/errors";

import type { AuthRepository } from "../repositories/auth.repository";
import type { AuthUserRow } from "../types/auth.types";
import type { GetAvatars } from "./get-avatars";
import { GetMe } from "./get-me";

const userRow: AuthUserRow = {
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

describe("GetMe", () => {
  const db = {} as never;
  let authRepository: {
    findSafeUserById: ReturnType<typeof vi.fn>;
    findPrimaryEmail: ReturnType<typeof vi.fn>;
    findPrimaryPhone: ReturnType<typeof vi.fn>;
  };
  let getAvatars: { execute: ReturnType<typeof vi.fn> };
  let useCase: GetMe;

  beforeEach(() => {
    authRepository = {
      findSafeUserById: vi.fn(),
      findPrimaryEmail: vi.fn(),
      findPrimaryPhone: vi.fn(),
    };
    getAvatars = {
      execute: vi.fn(),
    };
    useCase = new GetMe(
      db,
      authRepository as unknown as AuthRepository,
      getAvatars as unknown as GetAvatars,
    );
  });

  it("returns user, avatars, primary email, and primary phone", async () => {
    authRepository.findSafeUserById.mockResolvedValue(userRow);
    getAvatars.execute.mockResolvedValue({
      avatar1: "https://example.com/a1.avif",
      avatar2: null,
      avatar3: null,
    });
    authRepository.findPrimaryEmail.mockResolvedValue("ada@example.com");
    authRepository.findPrimaryPhone.mockResolvedValue({
      countryCode: 45,
      phoneNumber: "12345678",
    });

    const result = await useCase.execute(userRow.uuid);

    expect(result).toEqual({
      user: {
        uuid: userRow.uuid,
        email: "ada@example.com",
        firstname: "Ada",
        surname: "Lovelace",
        nickname: "Ada",
        dob: "1815-12-10",
        gender: "female",
        preferred_lang: "en",
        profileComplete: true,
      },
      avatars: {
        avatar1: "https://example.com/a1.avif",
        avatar2: null,
        avatar3: null,
      },
      primaryEmail: "ada@example.com",
      primaryPhone: {
        countryCode: 45,
        phoneNumber: "12345678",
      },
    });
  });

  it("returns null contact fields when unset", async () => {
    authRepository.findSafeUserById.mockResolvedValue(userRow);
    getAvatars.execute.mockResolvedValue({
      avatar1: null,
      avatar2: null,
      avatar3: null,
    });
    authRepository.findPrimaryEmail.mockResolvedValue(null);
    authRepository.findPrimaryPhone.mockResolvedValue(null);

    const result = await useCase.execute(userRow.uuid);

    expect(result.primaryEmail).toBeNull();
    expect(result.primaryPhone).toBeNull();
    expect(result.avatars).toEqual({
      avatar1: null,
      avatar2: null,
      avatar3: null,
    });
  });

  it("throws when the user is missing", async () => {
    authRepository.findSafeUserById.mockResolvedValue(null);

    await expect(useCase.execute(userRow.uuid)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
