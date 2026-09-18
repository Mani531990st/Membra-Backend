/**
 * Build stored shown_name: root shortName, or parentShownName + "." + shortName.
 */
export function buildShownName(
  shortName: string,
  parentShownName: string | null,
): string {
  if (!parentShownName) {
    return shortName;
  }
  return `${parentShownName}.${shortName}`;
}

export type LocationTreeNode = {
  id: number;
  parentLocationId: number | null;
  shortName: string;
  shownName: string;
};

/**
 * Depth-first order: each parent immediately followed by its subtree (stable by id).
 */
export function sortLocationsHierarchically<T extends LocationTreeNode>(
  rows: T[],
): T[] {
  const byParent = new Map<number | null, T[]>();
  for (const row of rows) {
    const key = row.parentLocationId;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.id - b.id);
  }

  const result: T[] = [];
  const visit = (parentId: number | null) => {
    const children = byParent.get(parentId) ?? [];
    for (const child of children) {
      result.push(child);
      visit(child.id);
    }
  };
  visit(null);
  return result;
}

/**
 * Recompute shownName for `root` and all descendants given a flat club location list.
 * Returns only rows whose shownName changed (including root if changed).
 */
export function cascadeShownNames(
  allInClub: LocationTreeNode[],
  rootId: number,
  nextShortName: string,
  nextParentId: number | null,
): Array<{ id: number; shownName: string }> {
  const byId = new Map(allInClub.map((row) => [row.id, { ...row }]));
  const root = byId.get(rootId);
  if (!root) {
    return [];
  }

  root.shortName = nextShortName;
  root.parentLocationId = nextParentId;

  const parentShown =
    nextParentId === null
      ? null
      : (byId.get(nextParentId)?.shownName ?? null);

  const updates: Array<{ id: number; shownName: string }> = [];

  const recompute = (id: number, parentShownName: string | null) => {
    const node = byId.get(id);
    if (!node) {
      return;
    }
    const shownName = buildShownName(node.shortName, parentShownName);
    if (node.shownName !== shownName) {
      node.shownName = shownName;
      updates.push({ id: node.id, shownName });
    } else {
      node.shownName = shownName;
    }
    for (const child of allInClub) {
      if (child.parentLocationId === id) {
        const live = byId.get(child.id);
        if (live) {
          recompute(live.id, shownName);
        }
      }
    }
  };

  recompute(rootId, parentShown);
  return updates;
}

/**
 * True if `candidateParentId` is `nodeId` or any descendant of `nodeId`.
 */
export function wouldCreateCycle(
  allInClub: LocationTreeNode[],
  nodeId: number,
  candidateParentId: number | null,
): boolean {
  if (candidateParentId === null) {
    return false;
  }
  if (candidateParentId === nodeId) {
    return true;
  }

  const childrenByParent = new Map<number, number[]>();
  for (const row of allInClub) {
    if (row.parentLocationId !== null) {
      const list = childrenByParent.get(row.parentLocationId) ?? [];
      list.push(row.id);
      childrenByParent.set(row.parentLocationId, list);
    }
  }

  const stack = [nodeId];
  const seen = new Set<number>();
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (seen.has(current)) {
      continue;
    }
    seen.add(current);
    if (current === candidateParentId) {
      return true;
    }
    for (const childId of childrenByParent.get(current) ?? []) {
      stack.push(childId);
    }
  }
  return false;
}
