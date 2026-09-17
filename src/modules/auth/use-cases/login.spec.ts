import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/shared/errors";

import { LOGIN_SESSION_TTL_MS } from "../lib/auth-helpers";
import { Login } from "./login";
import type { AuthUserRow } from "../types/auth.types";

const user: AuthUserRow = {
  uuid: "user-1",
  email: "ada@example.com",
  firstname: null,
  surname: null,
  nickname: null,
  dob: null,
  genderId: null,
  genderEnum: null,
  preferredLang: null,
  passwordHash: "hash",
};

describe("Login", () => {
  const db = {} as never;
  const authRepository = {
    findActiveUserByNormalizedEmail: vi.fn(),
  };
  const sessionIssuer = {
    issue: vi.fn(),
  };
  const passwordHasher = {
    verifyLogin: vi.fn(),
  };

  const login = new Login(
    db,
    authRepository as never,
    sessionIssuer as never,
    passwordHasher as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    sessionIssuer.issue.mockResolvedValue({
      rawToken: "token",
      expiresAt: new Date("2026-01-02T00:00:00.000Z"),
    });
  });

  it("still verifies a dummy hash when the email is unknown", async () => {
    authRepository.findActiveUserByNormalizedEmail.mockResolvedValue(null);
    passwordHasher.verifyLogin.mockResolvedValue(false);

    await expect(
      login.execute({ email: "missing@example.com", password: "password1" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(passwordHasher.verifyLogin).toHaveBeenCalledWith(undefined, "password1");
    expect(sessionIssuer.issue).not.toHaveBeenCalled();
  });

  it("issues a 24h session when rememberMe is omitted", async () => {
    authRepository.findActiveUserByNormalizedEmail.mockResolvedValue(user);
    passwordHasher.verifyLogin.mockResolvedValue(true);

    const result = await login.execute({
      email: "ada@example.com",
      password: "password1",
      rememberMe: false,
    });

    expect(sessionIssuer.issue).toHaveBeenCalledWith(
      "user-1",
      LOGIN_SESSION_TTL_MS.default,
    );
    expect(result.user.email).toBe("ada@example.com");
    expect(result.session.rawToken).toBe("token");
  });

  it("treats missing active users the same as unknown emails", async () => {
    // findActiveUserByNormalizedEmail filters users.active = true in the repository.
    authRepository.findActiveUserByNormalizedEmail.mockResolvedValue(null);
    passwordHasher.verifyLogin.mockResolvedValue(false);

    await expect(
      login.execute({ email: "inactive@example.com", password: "password1" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(sessionIssuer.issue).not.toHaveBeenCalled();
  });
});
