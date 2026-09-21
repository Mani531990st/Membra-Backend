import { beforeEach, describe, expect, it, vi } from "vitest";

import { ListAdminClubs } from "./list-admin-clubs";

describe("ListAdminClubs", () => {
  const clubs = {
    listByAdminUserId: vi.fn(),
    countAdmins: vi.fn(),
  };
  const avatarsRepository = {
    findByClubIds: vi.fn(),
  };
  const assembler = {
    signAvatar: vi.fn(),
  };
  const db = {} as never;

  const useCase = new ListAdminClubs(
    db,
    clubs as never,
    avatarsRepository as never,
    assembler as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty list when the user admins no clubs", async () => {
    clubs.listByAdminUserId.mockResolvedValue([]);

    await expect(useCase.execute("user-1")).resolves.toEqual({ clubs: [] });
    expect(avatarsRepository.findByClubIds).not.toHaveBeenCalled();
  });

  it("maps admin clubs with adminCount and signed avatar (avatar2)", async () => {
    clubs.listByAdminUserId.mockResolvedValue([
      {
        id: 10,
        name: "Alpha Club",
        shortName: "AC",
        establishedDate: "2020-01-01",
        active: true,
        countryCode: "DK",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: 11,
        name: "Beta Club",
        shortName: "BC",
        establishedDate: null,
        active: false,
        countryCode: "SE",
        createdAt: "2026-01-03T00:00:00.000Z",
        updatedAt: "2026-01-04T00:00:00.000Z",
      },
    ]);
    avatarsRepository.findByClubIds.mockResolvedValue(
      new Map([
        [
          10,
          { avatar1: "a1", avatar2: "a2", avatar3: null },
        ],
      ]),
    );
    clubs.countAdmins.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    assembler.signAvatar
      .mockResolvedValueOnce("https://signed/2")
      .mockResolvedValueOnce(null);

    const result = await useCase.execute("user-1");

    expect(clubs.listByAdminUserId).toHaveBeenCalledWith(db, "user-1");
    expect(avatarsRepository.findByClubIds).toHaveBeenCalledWith(db, [10, 11]);
    expect(assembler.signAvatar).toHaveBeenNthCalledWith(1, {
      avatar1: "a1",
      avatar2: "a2",
      avatar3: null,
    });
    expect(assembler.signAvatar).toHaveBeenNthCalledWith(2, null);
    expect(result).toEqual({
      clubs: [
        {
          id: 10,
          name: "Alpha Club",
          shortName: "AC",
          establishedDate: "2020-01-01",
          active: true,
          countryCode: "DK",
          adminCount: 2,
          avatar: "https://signed/2",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
        {
          id: 11,
          name: "Beta Club",
          shortName: "BC",
          establishedDate: null,
          active: false,
          countryCode: "SE",
          adminCount: 1,
          avatar: null,
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-04T00:00:00.000Z",
        },
      ],
    });
  });
});
