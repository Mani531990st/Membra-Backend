import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/shared/errors";

import { ResetPassword } from "./reset-password";

describe("ResetPassword", () => {
  it("consumes the token atomically and aborts when the token is already used", async () => {
    const tx = {};
    const db = {
      transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    };
    const authRepository = {
      consumeValidResetByTokenHash: vi.fn().mockResolvedValue(null),
      updatePasswordHash: vi.fn(),
    };
    const sessionRepository = {
      revokeAllForUser: vi.fn(),
    };
    const passwordHasher = {
      hash: vi.fn().mockResolvedValue("new-hash"),
    };

    const resetPassword = new ResetPassword(
      db as never,
      authRepository as never,
      sessionRepository as never,
      passwordHasher as never,
    );

    await expect(
      resetPassword.execute({ token: "reset-token", password: "newpassword" }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(authRepository.consumeValidResetByTokenHash).toHaveBeenCalled();
    expect(authRepository.updatePasswordHash).not.toHaveBeenCalled();
    expect(sessionRepository.revokeAllForUser).not.toHaveBeenCalled();
  });

  it("updates the password and revokes sessions after a successful consume", async () => {
    const tx = {};
    const db = {
      transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    };
    const authRepository = {
      consumeValidResetByTokenHash: vi.fn().mockResolvedValue({
        id: 1,
        userId: "user-1",
      }),
      updatePasswordHash: vi.fn(),
    };
    const sessionRepository = {
      revokeAllForUser: vi.fn(),
    };
    const passwordHasher = {
      hash: vi.fn().mockResolvedValue("new-hash"),
    };

    const resetPassword = new ResetPassword(
      db as never,
      authRepository as never,
      sessionRepository as never,
      passwordHasher as never,
    );

    const result = await resetPassword.execute({
      token: "reset-token",
      password: "newpassword",
    });

    expect(result.message).toMatch(/reset/i);
    expect(authRepository.updatePasswordHash).toHaveBeenCalledWith(
      tx,
      "user-1",
      "new-hash",
    );
    expect(sessionRepository.revokeAllForUser).toHaveBeenCalledWith(tx, "user-1");
  });
});
