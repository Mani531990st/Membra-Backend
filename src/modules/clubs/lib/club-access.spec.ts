import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/shared/errors";

import { ClubAccess } from "./club-access";

describe("ClubAccess", () => {
  const clubs = {
    findById: vi.fn(),
    isAdmin: vi.fn(),
  };
  const db = {} as never;
  const access = new ClubAccess(db, clubs as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireMember", () => {
    it("returns the club when the user is an admin", async () => {
      const club = { id: 1, name: "Example" };
      clubs.findById.mockResolvedValue(club);
      clubs.isAdmin.mockResolvedValue(true);

      await expect(access.requireMember(1, "user-1")).resolves.toBe(club);
      expect(clubs.isAdmin).toHaveBeenCalledWith(db, 1, "user-1");
    });

    it("throws NotFound when the club is missing", async () => {
      clubs.findById.mockResolvedValue(null);

      await expect(access.requireMember(99, "user-1")).rejects.toBeInstanceOf(
        NotFoundError,
      );
      expect(clubs.isAdmin).not.toHaveBeenCalled();
    });

    it("throws NotFound when the user is not a member (no existence leak)", async () => {
      clubs.findById.mockResolvedValue({ id: 1, name: "Example" });
      clubs.isAdmin.mockResolvedValue(false);

      await expect(access.requireMember(1, "stranger")).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
