/** Cloudflare / production：強制輸出文章頁真實錯誤（Next 會隱藏給瀏覽器） */
export function logBlogRenderError(
  phase: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error("【Blog Render Error】:", phase, {
    ...context,
    name: err.name,
    message: err.message,
    stack: err.stack,
    cause: err.cause,
  });
}
