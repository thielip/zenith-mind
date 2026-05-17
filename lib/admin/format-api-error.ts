/** 將 Google/gRPC/一般錯誤轉成可顯示字串（避免 undefined undefined: undefined） */
export function formatApiError(error: unknown): string {
  if (error == null) return "未知錯誤";
  if (typeof error === "string") return truncate(error);

  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg && !isUselessMessage(msg)) return truncate(msg);
    const cause = error.cause;
    if (cause) {
      const nested = formatApiError(cause);
      if (nested !== "未知錯誤") return nested;
    }
  }

  const e = error as Record<string, unknown>;

  if (typeof e["details"] === "string" && e["details"].trim()) {
    return truncate(e["details"].trim());
  }

  const nested = e["error"] as Record<string, unknown> | undefined;
  if (nested && typeof nested["message"] === "string" && nested["message"].trim()) {
    return truncate(nested["message"].trim());
  }

  const errors = e["errors"] as Array<{ message?: string }> | undefined;
  if (errors?.[0]?.message?.trim()) {
    return truncate(errors[0].message.trim());
  }

  const code = e["code"];
  const status = e["status"] ?? e["statusCode"];
  const reason =
    (typeof e["reason"] === "string" && e["reason"]) ||
    (typeof e["statusDetails"] === "string" && e["statusDetails"]) ||
    "";

  if (typeof code === "number" && typeof e["details"] === "string" && e["details"].trim()) {
    return truncate(`gRPC ${code}: ${e["details"].trim()}`);
  }

  if (code !== undefined || status !== undefined || reason) {
    const parts = [
      code !== undefined ? String(code) : "",
      status !== undefined ? String(status) : "",
    ].filter(Boolean);
    const head = parts.join(" ");
    const line = reason ? `${head}: ${reason}` : head;
    if (line.trim() && !isUselessMessage(line)) return truncate(line.trim());
  }

  if (typeof code === "number" || typeof code === "string") {
    return truncate(`gRPC 錯誤 code=${String(code)}（若剛更新 .env，請重啟 npm run dev）`);
  }

  if (error instanceof Error && error.stack) {
    const fromStack = error.stack.split("\n")[0]?.trim();
    if (fromStack && !isUselessMessage(fromStack)) return truncate(fromStack);
  }

  try {
    const json = JSON.stringify(error);
    if (json && json !== "{}" && json !== "[]") return truncate(json);
  } catch {
    /* ignore */
  }

  return "未知錯誤";
}

function isUselessMessage(msg: string) {
  const normalized = msg.replace(/^Error:\s*/i, "").trim();
  return (
    normalized === "undefined undefined: undefined" ||
    /^undefined(\s+undefined)*:?\s*undefined?$/i.test(normalized)
  );
}

function truncate(msg: string, max = 200) {
  const s = msg.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
