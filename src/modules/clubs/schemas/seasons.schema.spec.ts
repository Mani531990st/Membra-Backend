import { describe, expect, it } from "vitest";

import { CreateSeasonSchema, UpdateSeasonSchema } from "./seasons.schema";

describe("CreateSeasonSchema", () => {
  it("accepts a valid season", () => {
    const parsed = CreateSeasonSchema.parse({
      name: "Sommer 26",
      shortName: "s26",
      seasonStart: "2026-05-01",
      seasonEnd: "2026-08-31",
      forTeams: true,
      forLocations: false,
    });
    expect(parsed.active).toBe(true);
  });

  it("rejects seasonEnd before seasonStart", () => {
    const result = CreateSeasonSchema.safeParse({
      name: "Sommer 26",
      shortName: "s26",
      seasonStart: "2026-05-01",
      seasonEnd: "2026-04-01",
      forTeams: true,
      forLocations: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateSeasonSchema", () => {
  it("rejects when both dates are provided and end is before start", () => {
    const result = UpdateSeasonSchema.safeParse({
      seasonStart: "2026-09-01",
      seasonEnd: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});
