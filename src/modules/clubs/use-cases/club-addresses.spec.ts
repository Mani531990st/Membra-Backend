import { beforeEach, describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/shared/errors";

import { UpdateClubAddress } from "../use-cases/club-addresses";

describe("UpdateClubAddress", () => {
  const access = {
    requireAdmin: vi.fn(),
  };
  const addresses = {
    findByIdForClub: vi.fn(),
    countPrimaries: vi.fn(),
    clearPrimaryExcept: vi.fn(),
    update: vi.fn(),
  };
  const db = {
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({}),
    ),
  };

  const useCase = new UpdateClubAddress(
    db as never,
    access as never,
    addresses as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    access.requireAdmin.mockResolvedValue(undefined);
    addresses.findByIdForClub.mockResolvedValue({
      id: 5,
      clubId: 1,
      primary: true,
      active: true,
      streetName: "Lyngbyvej",
      streetNumber: "1",
      zip: "2100",
      city: "Copenhagen",
      region: null,
      name: "Main",
      shortName: "MH",
      directions: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    addresses.countPrimaries.mockResolvedValue(1);
  });

  it("refuses demoting the last primary address", async () => {
    await expect(
      useCase.execute(1, 5, "user-1", { primary: false }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(addresses.update).not.toHaveBeenCalled();
  });
});
