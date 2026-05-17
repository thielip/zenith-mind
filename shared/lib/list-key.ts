/** React 列表 key：路徑可能重複（如 /zh-TW、/en） */
export function listKey(parts: (string | number | undefined)[], index: number): string {
  return parts.filter((p) => p != null && String(p).length > 0).join("|") || `row-${index}`;
}
