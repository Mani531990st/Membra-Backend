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
      countryCode: "DK",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    assembler.assemble.mockResolvedValue({
      id: 10,
      avatars: { avatar1: null, avatar2: null, avatar3: null },
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
      sn: "ExC",
      establishedDate: null,
      active: true,
      countryCode: "DK",
      activityIds: [1],
      languages: [{ languageId: 2, rank: 1 }],
    });

    expect(clubs.insertClub).toHaveBeenCalledWith(tx, {
      name: "Example Club",
      shortName: "ExC",
      establishedDate: null,
      active: true,
      countryCode: "DK",
    });
    expect(clubs.insertAdmin).toHaveBeenCalledWith(tx, 10, "user-1");
    expect(clubs.replaceActivities).toHaveBeenCalledWith(tx, 10, [1]);
    expect(clubs.replaceLanguages).toHaveBeenCalledWith(tx, 10, [
      { languageId: 2, rank: 1 },
    ]);
    expect(storage.putObject).not.toHaveBeenCalled();
  });

  it("uploads three avatar variants when avatar is provided", async () => {
    await useCase.execute(
      "user-1",
      {
        name: "Example Club",
        sn: "ExC",
        establishedDate: null,
        active: true,
        countryCode: "DK",
        activityIds: [],
        languages: [],
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
      db,
      10,
      expect.objectContaining({
        avatar1: expect.stringMatching(/\.avif$/),
        avatar2: expect.stringMatching(/\.avif$/),
        avatar3: expect.stringMatching(/\.avif$/),
      }),
    );
  });

  it("rejects duplicate short names", async () => {
    clubs.findBySn.mockResolvedValue({ id: 99 });
    await expect(
      useCase.execute("user-1", {
        name: "Example Club",
        sn: "ExC",
        establishedDate: null,
        active: true,
        countryCode: "DK",
        activityIds: [],
        languages: [],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects invalid activity ids", async () => {
    catalog.assertActivityIdsExist.mockResolvedValue(false);
    await expect(
      useCase.execute("user-1", {
        name: "Example Club",
        sn: "ExC",
        establishedDate: null,
        active: true,
        countryCode: "DK",
        activityIds: [999],
        languages: [],
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
      short: "RP",
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
