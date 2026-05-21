export type FieldChange = { before: unknown; after: unknown };

export function buildFieldChanges<T extends Record<string, unknown>>(
  before: T,
  after: T,
  keys: (keyof T)[]
): Record<string, FieldChange> | null {
  const changes: Record<string, FieldChange> = {};
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    const same =
      b === a ||
      (b != null && a != null && JSON.stringify(b) === JSON.stringify(a));
    if (!same) {
      changes[String(key)] = { before: b ?? null, after: a ?? null };
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
}
