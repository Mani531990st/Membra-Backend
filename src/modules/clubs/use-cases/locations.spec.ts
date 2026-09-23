import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "@/shared/errors";

import {
  CreateLocation,
  DeleteLocation,
  UpdateLocation,
} from "./locations";

function locationRow(
  overrides: Partial<{
    id: number;
    clubId: number;
    name: string;
    shortName: string;
    shownName: string;
    parentLocationId: number | null;
    directions: string | null;
    clubAddressId: number | null;
    canMemberBook: boolean | null;
    canTeamBook: boolean;
    memberReqToBook: number | null;
    public: boolean;
    canFriendshipClubBook: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  }> = {},
) {
  return {
    id: 1,
    clubId: 12,
    name: "HH inde",
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
    ...overrides,
  };
}

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
    updateActiveByIds: vi.fn(),
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
    locations.findByIdForClub.mockResolvedValue(
      locationRow({
        id: 2,
        name: "Indendørs",
        shortName: "i",
        shownName: "HH.i",
        parentLocationId: 1,
      }),
    );
    locations.listByClubId.mockResolvedValue([
      locationRow({
        id: 1,
        shortName: "HH",
        shownName: "HH",
        parentLocationId: null,
      }),
      locationRow({
        id: 2,
        name: "Indendørs",
        shortName: "i",
        shownName: "HH.i",
        parentLocationId: 1,
      }),
      locationRow({
        id: 3,
        name: "Court JJ",
        shortName: "JJ",
        shownName: "HH.i.JJ",
        parentLocationId: 2,
      }),
    ]);
    locations.update.mockImplementation(
      async (_tx: unknown, _clubId: number, _id: number, patch: object) =>
        locationRow({
          id: 2,
          name: "Indendørs",
          shortName: "i",
          shownName: "HH.i",
          parentLocationId: 1,
          ...patch,
        }),
    );
    locations.updateActiveByIds.mockResolvedValue(undefined);
  });

  it("cascades shownName to descendants when shortName changes", async () => {
    const result = await useCase.execute(12, 2, "user-1", { shortName: "in" });

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
    expect(result.location.shownName).toBe("HH.in");
    expect(result.affected).toEqual([
      expect.objectContaining({ id: 3, shownName: "HH.in.JJ" }),
    ]);
  });

  it("rejects cyclic parent assignment", async () => {
    locations.findByIdForClub.mockResolvedValue(
      locationRow({
        id: 1,
        shortName: "HH",
        shownName: "HH",
        parentLocationId: null,
      }),
    );

    await expect(
      useCase.execute(12, 1, "user-1", { parentLocationId: 3 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("deactivates descendants when root becomes inactive", async () => {
    locations.findByIdForClub.mockResolvedValue(
      locationRow({
        id: 1,
        shortName: "HH",
        shownName: "HH",
        parentLocationId: null,
        active: true,
      }),
    );
    locations.update.mockImplementation(
      async (_tx: unknown, _clubId: number, _id: number, patch: object) =>
        locationRow({
          id: 1,
          shortName: "HH",
          shownName: "HH",
          parentLocationId: null,
          ...patch,
        }),
    );

    const result = await useCase.execute(12, 1, "user-1", { active: false });

    expect(locations.updateActiveByIds).toHaveBeenCalledWith(
      {},
      12,
      [3, 2],
      false,
    );
    expect(result.location).toEqual(
      expect.objectContaining({ id: 1, active: false }),
    );
    expect(result.affected).toEqual([
      expect.objectContaining({ id: 2, active: false }),
      expect.objectContaining({ id: 3, active: false }),
    ]);
  });

  it("activates inactive ancestors when a leaf becomes active", async () => {
    locations.findByIdForClub.mockResolvedValue(
      locationRow({
        id: 3,
        name: "Court JJ",
        shortName: "JJ",
        shownName: "HH.i.JJ",
        parentLocationId: 2,
        active: false,
      }),
    );
    locations.listByClubId.mockResolvedValue([
      locationRow({
        id: 1,
        shortName: "HH",
        shownName: "HH",
        parentLocationId: null,
        active: false,
      }),
      locationRow({
        id: 2,
        shortName: "i",
        shownName: "HH.i",
        parentLocationId: 1,
        active: false,
      }),
      locationRow({
        id: 3,
        shortName: "JJ",
        shownName: "HH.i.JJ",
        parentLocationId: 2,
        active: false,
      }),
    ]);
    locations.update.mockImplementation(
      async (_tx: unknown, _clubId: number, _id: number, patch: object) =>
        locationRow({
          id: 3,
          shortName: "JJ",
          shownName: "HH.i.JJ",
          parentLocationId: 2,
          ...patch,
        }),
    );

    const result = await useCase.execute(12, 3, "user-1", { active: true });

    expect(locations.updateActiveByIds).toHaveBeenCalledWith(
      {},
      12,
      [2, 1],
      true,
    );
    expect(result.location).toEqual(
      expect.objectContaining({ id: 3, active: true }),
    );
    expect(result.affected).toEqual([
      expect.objectContaining({ id: 1, active: true }),
      expect.objectContaining({ id: 2, active: true }),
    ]);
  });

  it("does not cascade activate when ancestors are already active", async () => {
    locations.findByIdForClub.mockResolvedValue(
      locationRow({
        id: 3,
        shortName: "JJ",
        shownName: "HH.i.JJ",
        parentLocationId: 2,
        active: false,
      }),
    );
    locations.update.mockImplementation(
      async (_tx: unknown, _clubId: number, _id: number, patch: object) =>
        locationRow({
          id: 3,
          shortName: "JJ",
          shownName: "HH.i.JJ",
          parentLocationId: 2,
          ...patch,
        }),
    );

    const result = await useCase.execute(12, 3, "user-1", { active: true });

    expect(locations.updateActiveByIds).not.toHaveBeenCalled();
    expect(result.location).toEqual(
      expect.objectContaining({ id: 3, active: true }),
    );
    expect(result.affected).toEqual([]);
  });
});

describe("DeleteLocation", () => {
  const access = { requireAdmin: vi.fn() };
  const locations = {
    findByIdForClub: vi.fn(),
    listByClubId: vi.fn(),
    deleteByIds: vi.fn(),
  };
  const db = {
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const useCase = new DeleteLocation(
    db as never,
    access as never,
    locations as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    access.requireAdmin.mockResolvedValue(undefined);
    locations.findByIdForClub.mockResolvedValue(locationRow({ id: 1 }));
    locations.listByClubId.mockResolvedValue([
      locationRow({ id: 1, parentLocationId: null }),
      locationRow({
        id: 2,
        shortName: "i",
        shownName: "HH.i",
        parentLocationId: 1,
      }),
      locationRow({
        id: 3,
        shortName: "JJ",
        shownName: "HH.i.JJ",
        parentLocationId: 2,
      }),
      locationRow({
        id: 4,
        shortName: "RP",
        shownName: "RP",
        parentLocationId: null,
      }),
    ]);
    locations.deleteByIds.mockResolvedValue(undefined);
  });

  it("deletes root and descendants deepest-first and returns deletedIds", async () => {
    const result = await useCase.execute(12, 1, "user-1");

    expect(locations.deleteByIds).toHaveBeenCalledWith({}, 12, [3, 2, 1]);
    expect(result).toEqual({ deletedIds: [3, 2, 1] });
  });

  it("throws NotFound when location is missing", async () => {
    locations.findByIdForClub.mockResolvedValue(null);
    await expect(useCase.execute(12, 99, "user-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(locations.deleteByIds).not.toHaveBeenCalled();
  });
});
