import { beforeEach, describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/shared/errors";

import { CreateLocation, UpdateLocation } from "./locations";

describe("CreateLocation", () => {
  const access = { requireAdmin: vi.fn() };
  const locations = {
    findByIdForClub: vi.fn(),
    addressBelongsToClub: vi.fn(),
    insert: vi.fn(),
  };
  const db = {} as never;

  const useCase = new CreateLocation(
    db,
    access as never,
    locations as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    access.requireAdmin.mockResolvedValue(undefined);
    locations.insert.mockImplementation(async (_db: unknown, values: object) => ({
      id: 101,
      clubId: 12,
      directions: null,
      clubAddressId: null,
      canMemberBook: null,
      memberReqToBook: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...values,
    }));
  });

  it("creates root with shownName equal to shortName", async () => {
    const result = await useCase.execute(12, "user-1", {
      name: "HH inde",
      shortName: "HH",
      parentLocationId: null,
      canTeamBook: true,
      public: false,
      canFriendshipClubBook: true,
      active: true,
    });

    expect(locations.insert).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ shownName: "HH", shortName: "HH" }),
    );
    expect(result.shownName).toBe("HH");
  });

  it("creates child with parent.shownName.shortName", async () => {
    locations.findByIdForClub.mockResolvedValue({
      id: 101,
      clubId: 12,
      shownName: "HH",
    });

    const result = await useCase.execute(12, "user-1", {
      name: "Indendørs",
      shortName: "i",
      parentLocationId: 101,
      canTeamBook: true,
      public: false,
      canFriendshipClubBook: false,
      active: true,
    });

    expect(result.shownName).toBe("HH.i");
  });

  it("rejects parent from outside club", async () => {
    locations.findByIdForClub.mockResolvedValue(null);
    await expect(
      useCase.execute(12, "user-1", {
        name: "X",
        shortName: "x",
        parentLocationId: 999,
        canTeamBook: true,
        public: false,
        canFriendshipClubBook: false,
        active: true,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("UpdateLocation cascade", () => {
  const access = { requireAdmin: vi.fn() };
  const locations = {
    findByIdForClub: vi.fn(),
    listByClubId: vi.fn(),
    addressBelongsToClub: vi.fn(),
    update: vi.fn(),
    updateShownNames: vi.fn(),
  };
  const db = {
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };

  const useCase = new UpdateLocation(
    db as never,
    access as never,
    locations as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    access.requireAdmin.mockResolvedValue(undefined);
    locations.findByIdForClub.mockResolvedValue({
      id: 2,
      clubId: 12,
      name: "Indendørs",
      shortName: "i",
      shownName: "HH.i",
      parentLocationId: 1,
      directions: null,
      clubAddressId: null,
      canMemberBook: false,
      canTeamBook: true,
      memberReqToBook: null,
      public: false,
      canFriendshipClubBook: false,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    locations.listByClubId.mockResolvedValue([
      {
        id: 1,
        clubId: 12,
        shortName: "HH",
        shownName: "HH",
        parentLocationId: null,
      },
      {
        id: 2,
        clubId: 12,
        shortName: "i",
        shownName: "HH.i",
        parentLocationId: 1,
      },
      {
        id: 3,
        clubId: 12,
        shortName: "JJ",
        shownName: "HH.i.JJ",
        parentLocationId: 2,
      },
    ]);
    locations.update.mockImplementation(
      async (_tx: unknown, _clubId: number, _id: number, patch: object) => ({
        id: 2,
        clubId: 12,
        name: "Indendørs",
        shortName: "i",
        shownName: "HH.i",
        parentLocationId: 1,
        directions: null,
        clubAddressId: null,
        canMemberBook: false,
        canTeamBook: true,
        memberReqToBook: null,
        public: false,
        canFriendshipClubBook: false,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...patch,
      }),
    );
  });

  it("cascades shownName to descendants when shortName changes", async () => {
    await useCase.execute(12, 2, "user-1", { shortName: "in" });

    expect(locations.updateShownNames).toHaveBeenCalledWith(
      {},
      expect.arrayContaining([{ id: 3, shownName: "HH.in.JJ" }]),
    );
    expect(locations.update).toHaveBeenCalledWith(
      {},
      12,
      2,
      expect.objectContaining({
        shortName: "in",
        shownName: "HH.in",
      }),
    );
  });

  it("rejects cyclic parent assignment", async () => {
    locations.findByIdForClub.mockResolvedValue({
      id: 1,
      clubId: 12,
      name: "HH",
      shortName: "HH",
      shownName: "HH",
      parentLocationId: null,
      directions: null,
      clubAddressId: null,
      canMemberBook: false,
      canTeamBook: true,
      memberReqToBook: null,
      public: false,
      canFriendshipClubBook: false,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    await expect(
      useCase.execute(12, 1, "user-1", { parentLocationId: 3 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
