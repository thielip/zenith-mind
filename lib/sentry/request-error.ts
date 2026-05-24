/** 導覽切換、SSE 關閉、Playwright 快速換頁時常見，非實際故障 */
export function isIgnorableRequestError(error: unknown): boolean {
  if (!error) return false;
  const rec =
    typeof error === "object" && error !== null
      ? (error as { name?: string; message?: string })
      : null;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (rec?.message ?? "");
  const name = error instanceof Error ? error.name : (rec?.name ?? "");
  return (
    name === "AbortError" ||
    /aborted/i.test(message) ||
    message.includes("ECONNRESET") ||
    message.includes("The operation was aborted")
  );
}
