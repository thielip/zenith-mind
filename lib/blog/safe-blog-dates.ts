/** 文章頁日期安全處理（Supabase 字串 / Invalid Date 勿讓 toISOString 炸整頁） */
export function toSafeDate(value: Date | string | null | undefined): Date {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function toIsoStringSafe(value: Date | string | null | undefined): string {
  return toSafeDate(value).toISOString();
}
