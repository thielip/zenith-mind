/** UTC 日期（不含時間），對應 DB DATE */
export function utcDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function lastNDaysUtc(n: number): Date[] {
  const today = utcDateOnly(new Date());
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d);
  }
  return days;
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 依過去 7 天每日點擊建立 sparkline 序列（缺日補 0） */
export function buildSevenDaySeries(
  dailyMap: Map<string, number>,
  dayKeys: string[]
): number[] {
  return dayKeys.map((key) => dailyMap.get(key) ?? 0);
}
