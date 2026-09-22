import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError, ValidationError } from "@/shared/errors";

import { CreateSeason, UpdateSeason } from "./seasons";

const baseCreate = {
  name: "Sommer 26",
  shortName: "s26",
  seasonStart: "2026-05-01",
  seasonEnd: "2026-08-31",
  forTeams: true,
  forLocations: false,
  active: true,
};

describe("CreateSeason", () => {
  const access = { requireAdmin: vi.fn() };
  const seasons = { insert: vi.fn() };
  const db = {} as never;

  const useCase = new CreateSeason(db, access as never, seasons as never);

  beforeEach(() => {
    vi.clearAllMocks();
    access.requireAdmin.mockResolvedValue(undefined);
    seasons.insert.mockImplementation(
      async (_db: unknown, values: Record<string, unknown>) => ({
        id: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...values,
      }),
    );
  });

  it("creates a season for an admin", async () => {
    const result = await useCase.execute(12, "user-1", baseCreate);

    expect(access.requireAdmin).toHaveBeenCalledWith(12, "user-1");
    expect(seasons.insert).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        clubId: 12,
        shortName: "s26",
        seasonStart: "2026-05-01",
        seasonEnd: "2026-08-31",
      }),
    );
    expect(result.shortName).toBe("s26");
  });

  it("maps unique shortName conflicts", async () => {
    seasons.insert.mockRejectedValue({ code: "23505" });
    await expect(useCase.execute(12, "user-1", baseCreate)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});

describe("UpdateSeason", () => {
  const access = { requireAdmin: vi.fn() };
  const seasons = {
    findByIdForClub: vi.fn(),
    update: vi.fn(),
  };
  const db = {} as never;

  const useCase = new UpdateSeason(db, access as never, seasons as never);

  beforeEach(() => {
    vi.clearAllMocks();
    access.requireAdmin.mockResolvedValue(undefined);
    seasons.findByIdForClub.mockResolvedValue({
      id: 1,
      clubId: 12,
      name: "Sommer 26",
      shortName: "s26",
      seasonStart: "2026-05-01",
      seasonEnd: "2026-08-31",
      forTeams: true,
      forLocations: false,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    seasons.update.mockImplementation(
      async (
        _db: unknown,
        _clubId: number,
        _id: number,
        patch: Record<string, unknown>,
      ) => ({
        id: 1,
        clubId: 12,
        name: "Sommer 26",
        shortName: "s26",
        seasonStart: "2026-05-01",
        seasonEnd: "2026-08-31",
        forTeams: true,
        forLocations: false,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        ...patch,
      }),
    );
  });

  it("soft-offs via active", async () => {
    const result = await useCase.execute(12, 1, "user-1", { active: false });
    expect(result.active).toBe(false);
  });

  it("rejects seasonEnd before seasonStart when patching end only", async () => {
    await expect(
      useCase.execute(12, 1, "user-1", { seasonEnd: "2026-04-01" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(seasons.update).not.toHaveBeenCalled();
  });
});
