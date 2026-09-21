import { beforeEach, describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/shared/errors";

import { AddClubAddress, UpdateClubAddress } from "../use-cases/club-addresses";

const baseAddressInput = {
  streetName: "Lyngbyvej",
  streetNumber: "1",
  zip: "2100",
  city: "Copenhagen",
  name: "Main",
  shortName: "MH",
  primary: false,
  active: true,
};

describe("AddClubAddress", () => {
  const access = {
    requireAdmin: vi.fn(),
  };
  const addresses = {
    countPrimaries: vi.fn(),
    clearPrimaryExcept: vi.fn(),
    insert: vi.fn(),
  };
  const db = {
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({}),
    ),
  };

  const useCase = new AddClubAddress(
    db as never,
    access as never,
    addresses as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    access.requireAdmin.mockResolvedValue(undefined);
    addresses.insert.mockImplementation(
      async (_tx: unknown, values: Record<string, unknown>) => ({
        id: 1,
        clubId: 1,
        region: null,
        directions: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...values,
      }),
    );
  });

  it("forces primary when the club has no primary yet", async () => {
    addresses.countPrimaries.mockResolvedValue(0);

    const result = await useCase.execute(1, "user-1", {
      ...baseAddressInput,
      primary: false,
    });

    expect(addresses.clearPrimaryExcept).toHaveBeenCalledWith({}, 1);
    expect(addresses.insert).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ primary: true }),
    );
    expect(result.primary).toBe(true);
  });

  it("respects primary false when another primary already exists", async () => {
    addresses.countPrimaries.mockResolvedValue(1);

    const result = await useCase.execute(1, "user-1", {
      ...baseAddressInput,
      primary: false,
    });

    expect(addresses.clearPrimaryExcept).not.toHaveBeenCalled();
    expect(addresses.insert).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ primary: false }),
    );
    expect(result.primary).toBe(false);
  });

  it("rejects inactive primary when forced as first primary", async () => {
    addresses.countPrimaries.mockResolvedValue(0);

    await expect(
      useCase.execute(1, "user-1", {
        ...baseAddressInput,
        primary: false,
        active: false,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(addresses.insert).not.toHaveBeenCalled();
  });
});

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
