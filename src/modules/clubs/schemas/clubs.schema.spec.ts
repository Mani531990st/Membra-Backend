import { describe, expect, it } from "vitest";

import { CreateClubSchema } from "./clubs.schema";

const base = {
  name: "Example Club",
  shortName: "ExC",
};

const address = {
  streetName: "Lyngbyvej",
  streetNumber: "1",
  zip: "2100",
  city: "Copenhagen",
  name: "Main hall",
  shortName: "MH",
  active: true,
};

describe("CreateClubSchema addresses", () => {
  it("accepts addresses without primary", () => {
    const parsed = CreateClubSchema.parse({
      ...base,
      addresses: [address],
    });
    expect(parsed.addresses).toHaveLength(1);
    expect(parsed.addresses[0]?.primary).toBeUndefined();
  });

  it("accepts multiple addresses without primary", () => {
    const parsed = CreateClubSchema.parse({
      ...base,
      addresses: [
        address,
        { ...address, shortName: "AX", name: "Annex" },
      ],
    });
    expect(parsed.addresses).toHaveLength(2);
  });

  it("rejects inactive first address", () => {
    const result = CreateClubSchema.safeParse({
      ...base,
      addresses: [{ ...address, active: false }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("cannot be inactive"),
        ),
      ).toBe(true);
    }
  });

  it("defaults addresses to empty array", () => {
    const parsed = CreateClubSchema.parse(base);
    expect(parsed.addresses).toEqual([]);
  });

  it("rejects duplicate activityIds", () => {
    const result = CreateClubSchema.safeParse({
      ...base,
      activityIds: [1, 1],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate languageId values", () => {
    const result = CreateClubSchema.safeParse({
      ...base,
      languages: [
        { languageId: "da", rank: 1 },
        { languageId: "da", rank: 2 },
      ],
    });
    expect(result.success).toBe(false);
  });
});
