import { describe, expect, it } from "vitest";

import { ValidationError } from "@/shared/errors";

import { parseCreateClubMultipartBody } from "./parse-create-club-multipart";

describe("parseCreateClubMultipartBody", () => {
  it("parses JSON string arrays and boolean strings", () => {
    const result = parseCreateClubMultipartBody({
      name: "Example Club",
      shortName: "ExC",
      active: "true",
      countryCode: "dk",
      activityIds: "[1,2]",
      languages: '[{"languageId":1,"rank":1}]',
      addresses:
        '[{"streetName":"Lyngbyvej","streetNumber":"1","zip":"2100","city":"Copenhagen","name":"Main hall","shortName":"MH"}]',
    });

    expect(result).toEqual({
      name: "Example Club",
      shortName: "ExC",
      active: true,
      countryCode: "dk",
      activityIds: [1, 2],
      languages: [{ languageId: 1, rank: 1 }],
      addresses: [
        {
          streetName: "Lyngbyvej",
          streetNumber: "1",
          zip: "2100",
          city: "Copenhagen",
          name: "Main hall",
          shortName: "MH",
        },
      ],
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

  it("rejects nonsense addresses JSON", () => {
    expect(() =>
      parseCreateClubMultipartBody({
        addresses: "not-json",
      }),
    ).toThrow(ValidationError);
  });
});
