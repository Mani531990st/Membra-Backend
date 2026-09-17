import { describe, expect, it } from "vitest";

import { ValidationError } from "@/shared/errors";

import { parseCreateClubMultipartBody } from "./parse-create-club-multipart";

describe("parseCreateClubMultipartBody", () => {
  it("parses JSON string arrays and boolean strings", () => {
    const result = parseCreateClubMultipartBody({
      name: "Example Club",
      short_name: "ExC",
      active: "true",
      country_code: "dk",
      activityIds: "[1,2]",
      languages: '[{"language_id":1,"rank":1}]',
    });

    expect(result).toEqual({
      name: "Example Club",
      short_name: "ExC",
      active: true,
      country_code: "dk",
      activityIds: [1, 2],
      languages: [{ language_id: 1, rank: 1 }],
    });
  });

  it("accepts comma-separated activityIds from Swagger", () => {
    const result = parseCreateClubMultipartBody({
      activityIds: "1,2",
    });
    expect(result.activityIds).toEqual([1, 2]);
  });

  it("accepts activityIds wrapped in extra quotes", () => {
    const result = parseCreateClubMultipartBody({
      activityIds: '"[1,2]"',
    });
    expect(result.activityIds).toEqual([1, 2]);
  });

  it("rejects nonsense activityIds", () => {
    expect(() =>
      parseCreateClubMultipartBody({
        activityIds: "not-json",
      }),
    ).toThrow(ValidationError);
  });
});
