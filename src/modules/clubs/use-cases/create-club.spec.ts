import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError, ValidationError } from "@/shared/errors";

import { MakeClubAddressPrimary } from "./club-addresses";
import { UpdateClubAvatars } from "./club-avatars";
import { CreateClub } from "./create-club";

vi.mock("@/shared/images/avatar-image", async () => {
  const actual = await vi.importActual<
    typeof import("@/shared/images/avatar-image")
  >("@/shared/images/avatar-image");
  return {
    ...actual,
    buildAvatarVariants: vi.fn(),
  };
});

import { buildAvatarVariants } from "@/shared/images/avatar-image";

const buildAvatarVariantsMock = vi.mocked(buildAvatarVariants);

describe("CreateClub", () => {
  const clubs = {
    findBySn: vi.fn(),
    insertClub: vi.fn(),
    insertAdmin: vi.fn(),
    replaceActivities: vi.fn(),
    replaceLanguages: vi.fn(),
  };
  const catalog = {
    assertActivityIdsExist: vi.fn(),
    assertLanguageIdsExist: vi.fn(),
  };
  const addresses = {
    insert: vi.fn(),
  };
  const avatarsRepository = {
    upsertSlots: vi.fn(),
  };
  const storage = {
    putObject: vi.fn(),
  };
  const assembler = {
    assemble: vi.fn(),
  };

  const tx = {};
  const db = {
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  const useCase = new CreateClub(
    db as never,
    clubs as never,
    catalog as never,
    addresses as never,
    avatarsRepository as never,
    storage as never,
    assembler as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    clubs.findBySn.mockResolvedValue(null);
    catalog.assertActivityIdsExist.mockResolvedValue(true);
    catalog.assertLanguageIdsExist.mockResolvedValue(true);
    clubs.insertClub.mockResolvedValue({
      id: 10,
      name: "Example Club",
      shortName: "ExC",
      establishedDate: null,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    assembler.assemble.mockResolvedValue({
      id: 10,
      avatar: null,
    });
    buildAvatarVariantsMock.mockResolvedValue({
      original: Buffer.from("o"),
      medium: Buffer.from("m"),
      small: Buffer.from("s"),
    });
    storage.putObject.mockResolvedValue(undefined);
    avatarsRepository.upsertSlots.mockResolvedValue({
      avatar1: "a1",
      avatar2: "a2",
      avatar3: "a3",
    });
  });

  it("creates club, assigns creator as admin, and sets pivots", async () => {
    await useCase.execute("user-1", {
      name: "Example Club",
      shortName: "ExC",
      establishedDate: null,
      active: true,
      activityIds: [1],
      languages: [{ languageId: "en-US", rank: 1 }],
      addresses: [],
    });

    expect(clubs.insertClub).toHaveBeenCalledWith(tx, {
      name: "Example Club",
      shortName: "ExC",
      establishedDate: null,
      active: true,
    });
    expect(clubs.insertAdmin).toHaveBeenCalledWith(tx, 10, "user-1");
    expect(clubs.replaceActivities).toHaveBeenCalledWith(tx, 10, [1]);
    expect(clubs.replaceLanguages).toHaveBeenCalledWith(tx, 10, [
      { languageId: "en-US", rank: 1 },
    ]);
    expect(addresses.insert).not.toHaveBeenCalled();
    expect(storage.putObject).not.toHaveBeenCalled();
  });

  it("inserts addresses when provided", async () => {
    await useCase.execute("user-1", {
      name: "Example Club",
      shortName: "ExC",
      establishedDate: null,
      active: true,
      activityIds: [],
      languages: [],
      addresses: [
        {
          streetName: "Lyngbyvej",
          streetNumber: "1",
          zip: "2100",
          city: "Copenhagen",
          region: null,
          name: "Main hall",
          shortName: "MH",
          directions: null,
          active: true,
        },
        {
          streetName: "Sidevej",
          streetNumber: "2",
          zip: "2100",
          city: "Copenhagen",
          name: "Annex",
          shortName: "AX",
          primary: true,
          active: true,
        },
      ],
    });

    expect(addresses.insert).toHaveBeenCalledTimes(2);
    expect(addresses.insert).toHaveBeenNthCalledWith(1, tx, {
      clubId: 10,
      streetName: "Lyngbyvej",
      streetNumber: "1",
      zip: "2100",
      city: "Copenhagen",
      region: null,
      name: "Main hall",
      shortName: "MH",
      directions: null,
      primary: true,
      active: true,
    });
    expect(addresses.insert).toHaveBeenNthCalledWith(
      2,
      tx,
      expect.objectContaining({
        clubId: 10,
        streetName: "Sidevej",
        primary: false,
      }),
    );
  });

  it("uploads three avatar variants when avatar is provided", async () => {
    await useCase.execute(
      "user-1",
      {
        name: "Example Club",
        shortName: "ExC",
        establishedDate: null,
        active: true,
        activityIds: [],
        languages: [],
        addresses: [],
      },
      {
        buffer: Buffer.from("image"),
        mimetype: "image/jpeg",
        size: 5,
      },
    );

    expect(buildAvatarVariantsMock).toHaveBeenCalledTimes(1);
    expect(storage.putObject).toHaveBeenCalledTimes(3);
    expect(avatarsRepository.upsertSlots).toHaveBeenCalledWith(
      tx,
      10,
      expect.objectContaining({
        avatar1: expect.stringMatching(/\.avif$/),
        avatar2: expect.stringMatching(/\.avif$/),
        avatar3: expect.stringMatching(/\.avif$/),
      }),
    );
  });

  it("maps unique shortName violation during insert to ConflictError", async () => {
    clubs.insertClub.mockRejectedValue({ code: "23505" });
    await expect(
      useCase.execute("user-1", {
        name: "Example Club",
        shortName: "ExC",
        establishedDate: null,
        active: true,
        activityIds: [],
        languages: [],
        addresses: [],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("uploads avatar objects before the DB transaction commits keys", async () => {
    const callOrder: string[] = [];
    storage.putObject.mockImplementation(async () => {
      callOrder.push("putObject");
    });
    db.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      callOrder.push("transaction");
      return fn(tx);
    });
    avatarsRepository.upsertSlots.mockImplementation(async () => {
      callOrder.push("upsertSlots");
      return { avatar1: "a1", avatar2: "a2", avatar3: "a3" };
    });

    await useCase.execute(
      "user-1",
      {
        name: "Example Club",
        shortName: "ExC",
        establishedDate: null,
        active: true,
        activityIds: [],
        languages: [],
        addresses: [],
      },
      {
        buffer: Buffer.from("image"),
        mimetype: "image/jpeg",
        size: 5,
      },
    );

    expect(callOrder.indexOf("putObject")).toBeLessThan(
      callOrder.indexOf("transaction"),
    );
    expect(callOrder.indexOf("upsertSlots")).toBeGreaterThan(
      callOrder.indexOf("transaction"),
    );
  });

  it("rejects duplicate short names", async () => {
    clubs.findBySn.mockResolvedValue({ id: 99 });
    await expect(
      useCase.execute("user-1", {
        name: "Example Club",
        shortName: "ExC",
        establishedDate: null,
        active: true,
        activityIds: [],
        languages: [],
        addresses: [],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects invalid activity ids", async () => {
    catalog.assertActivityIdsExist.mockResolvedValue(false);
    await expect(
      useCase.execute("user-1", {
        name: "Example Club",
        shortName: "ExC",
        establishedDate: null,
        active: true,
        activityIds: [999],
        languages: [],
        addresses: [],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("MakeClubAddressPrimary", () => {
  const access = {
    requireAdmin: vi.fn(),
  };
  const addresses = {
    findByIdForClub: vi.fn(),
    setPrimary: vi.fn(),
  };
  const db = {
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({}),
    ),
  };

  const useCase = new MakeClubAddressPrimary(
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
      primary: false,
      active: true,
    });
    addresses.setPrimary.mockResolvedValue({
      id: 5,
      streetName: "Lyngbyvej",
      streetNumber: "1",
      zip: "2100",
      city: "Copenhagen",
      region: null,
      countryId: null,
      name: "Main",
      shortName: "RP",
      directions: null,
      primary: true,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("sets the address primary via repository transaction", async () => {
    const result = await useCase.execute(1, 5, "user-1");
    expect(access.requireAdmin).toHaveBeenCalledWith(1, "user-1");
    expect(addresses.setPrimary).toHaveBeenCalled();
    expect(result.primary).toBe(true);
    expect(result.shortName).toBe("RP");
    expect(result.streetName).toBe("Lyngbyvej");
    expect(result).not.toHaveProperty("countryId");
  });
});

describe("UpdateClubAvatars", () => {
  const access = {
    requireAdmin: vi.fn(),
  };
  const avatarsRepository = {
    findByClubId: vi.fn(),
    upsertSlots: vi.fn(),
  };
  const storage = {
    putObject: vi.fn(),
    deleteObject: vi.fn(),
    getSignedGetUrl: vi.fn(),
  };
  const assembler = {
    signAvatars: vi.fn(),
  };
  const db = {} as never;

  const useCase = new UpdateClubAvatars(
    db,
    access as never,
    avatarsRepository as never,
    storage as never,
    assembler as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    access.requireAdmin.mockResolvedValue(undefined);
    avatarsRepository.findByClubId.mockResolvedValue(null);
    buildAvatarVariantsMock.mockResolvedValue({
      original: Buffer.from("o"),
      medium: Buffer.from("m"),
      small: Buffer.from("s"),
    });
    storage.putObject.mockResolvedValue(undefined);
    avatarsRepository.upsertSlots.mockImplementation(
      async (_db: unknown, _clubId: number, slots: Record<string, string>) =>
        slots,
    );
    assembler.signAvatars.mockResolvedValue({
      avatar1: "https://signed/1",
      avatar2: "https://signed/2",
      avatar3: "https://signed/3",
    });
  });

  it("rejects empty avatar uploads", async () => {
    await expect(
      useCase.execute(1, "user-1", {
        buffer: Buffer.alloc(0),
        mimetype: "image/png",
        size: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("uploads three variants for a club", async () => {
    const result = await useCase.execute(7, "user-1", {
      buffer: Buffer.from("image"),
      mimetype: "image/jpeg",
      size: 5,
    });

    expect(storage.putObject).toHaveBeenCalledTimes(3);
    expect(avatarsRepository.upsertSlots).toHaveBeenCalled();
    expect(result.avatar1).toBe("https://signed/1");
  });
});
