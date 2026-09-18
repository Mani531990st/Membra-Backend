import { describe, expect, it } from "vitest";

import {
  buildShownName,
  cascadeShownNames,
  sortLocationsHierarchically,
  wouldCreateCycle,
} from "./location-shown-name";

describe("buildShownName", () => {
  it("uses shortName alone for roots", () => {
    expect(buildShownName("HH", null)).toBe("HH");
  });

  it("joins parent shown name with shortName", () => {
    expect(buildShownName("i", "HH")).toBe("HH.i");
    expect(buildShownName("JJ", "HH.i")).toBe("HH.i.JJ");
  });
});

describe("sortLocationsHierarchically", () => {
  it("returns depth-first parent-then-children order", () => {
    const rows = [
      { id: 3, parentLocationId: 2, shortName: "JJ", shownName: "HH.i.JJ" },
      { id: 1, parentLocationId: null, shortName: "HH", shownName: "HH" },
      { id: 2, parentLocationId: 1, shortName: "i", shownName: "HH.i" },
      { id: 4, parentLocationId: null, shortName: "RP", shownName: "RP" },
    ];
    expect(sortLocationsHierarchically(rows).map((r) => r.id)).toEqual([
      1, 2, 3, 4,
    ]);
  });
});

describe("wouldCreateCycle", () => {
  const tree = [
    { id: 1, parentLocationId: null, shortName: "HH", shownName: "HH" },
    { id: 2, parentLocationId: 1, shortName: "i", shownName: "HH.i" },
    { id: 3, parentLocationId: 2, shortName: "JJ", shownName: "HH.i.JJ" },
  ];

  it("rejects self and descendant parents", () => {
    expect(wouldCreateCycle(tree, 1, 1)).toBe(true);
    expect(wouldCreateCycle(tree, 1, 3)).toBe(true);
    expect(wouldCreateCycle(tree, 2, 3)).toBe(true);
  });

  it("allows valid parents", () => {
    expect(wouldCreateCycle(tree, 3, 1)).toBe(false);
    expect(wouldCreateCycle(tree, 2, null)).toBe(false);
  });
});

describe("cascadeShownNames", () => {
  it("updates node and descendants when shortName changes", () => {
    const tree = [
      { id: 1, parentLocationId: null, shortName: "HH", shownName: "HH" },
      { id: 2, parentLocationId: 1, shortName: "i", shownName: "HH.i" },
      { id: 3, parentLocationId: 2, shortName: "JJ", shownName: "HH.i.JJ" },
    ];
    const updates = cascadeShownNames(tree, 2, "in", 1);
    expect(updates).toEqual(
      expect.arrayContaining([
        { id: 2, shownName: "HH.in" },
        { id: 3, shownName: "HH.in.JJ" },
      ]),
    );
  });
});
