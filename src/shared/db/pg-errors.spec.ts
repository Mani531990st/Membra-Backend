import { describe, expect, it } from "vitest";

import { isUniqueViolation } from "./pg-errors";

describe("isUniqueViolation", () => {
  it("detects PostgreSQL 23505", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
