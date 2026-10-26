// Rewrites the order of the items in one group (e.g. the Daily Expected
// activities) to follow orderedIds, leaving every other item exactly where it
// is. Returns the list untouched if orderedIds doesn't match the group.
export function applyGroupOrder<T extends { id: string }>(
  list: T[],
  orderedIds: string[],
  inGroup: (item: T) => boolean = () => true
): T[] {
  const byId = new Map(list.map((item) => [item.id, item]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((item): item is T => !!item && inGroup(item));
  if (ordered.length !== list.filter(inGroup).length) return list;
  let next = 0;
  return list.map((item) => (inGroup(item) ? ordered[next++] : item));
}
