// Moves one item a step up or down among the items that share its group,
// leaving every other item (including those in other groups) where it is —
// e.g. nudging a Daily Expected activity past the next Daily one, with the
// Weekly ones interleaved in the same array staying put.
export function moveWithinGroup<T extends { id: string }>(
  list: T[],
  id: string,
  direction: 'up' | 'down',
  sameGroup: (a: T, b: T) => boolean = () => true
): T[] {
  const from = list.findIndex((item) => item.id === id);
  if (from < 0) return list;
  const step = direction === 'up' ? -1 : 1;
  let to = from + step;
  while (to >= 0 && to < list.length && !sameGroup(list[from], list[to])) to += step;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
