import { describe, expect, it, vi } from "vitest";

import { Logout } from "./logout";

describe("Logout", () => {
  const current = { id: "current-id", userId: "user-1" };

  it("defaults to the current session when session_id is omitted", async () => {
    const sessionRepository = {
      findActiveSessionForUser: vi.fn().mockResolvedValue({ id: "current-id" }),
      revokeSession: vi.fn(),
    };
    const logout = new Logout({} as never, sessionRepository as never);

    const result = await logout.execute(current, {});

    expect(sessionRepository.findActiveSessionForUser).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ sessionId: "current-id", userId: "user-1" }),
    );
    expect(result.clearCookie).toBe(true);
  });

  it("leaves the cookie when revoking another session", async () => {
    const sessionRepository = {
      findActiveSessionForUser: vi.fn().mockResolvedValue({ id: "other-id" }),
      revokeSession: vi.fn(),
    };
    const logout = new Logout({} as never, sessionRepository as never);

    const result = await logout.execute(current, { session_id: "other-id" });

    expect(result.clearCookie).toBe(false);
  });
});
