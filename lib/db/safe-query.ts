/** 公開頁資料查詢：失敗時回傳 fallback，避免單一模組拖垮整頁 */
export async function safeQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[safeQuery] ${label} failed`, error);
    } else {
      console.error(`[safeQuery] ${label} failed`, error);
    }
    return fallback;
  }
}
