import { createPrivateKey } from "node:crypto";

/**
 * 正規化 GCP 服務帳號 PEM（Vercel / DB 常見 \\n、引號、單行 base64）。
 */
export function normalizeServiceAccountPrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  key = key.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r/g, "");
  key = key.replace(/\\\\n/g, "\n");

  const hasPemHeader =
    key.includes("BEGIN PRIVATE KEY") || key.includes("BEGIN RSA PRIVATE KEY");

  if (!hasPemHeader) {
    const compact = key.replace(/\s+/g, "");
    if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) {
      const lines = compact.match(/.{1,64}/g) ?? [compact];
      key = `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----`;
    }
  }

  return key.trim();
}

export function validateServiceAccountPrivateKey(raw: string): {
  ok: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = normalizeServiceAccountPrivateKey(raw);
  if (
    !normalized.includes("BEGIN PRIVATE KEY") &&
    !normalized.includes("BEGIN RSA PRIVATE KEY")
  ) {
    return { ok: false, normalized, error: "私鑰缺少 PEM 標頭（BEGIN PRIVATE KEY）" };
  }
  try {
    createPrivateKey(normalized);
    return { ok: true, normalized };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "私鑰無法解析";
    return { ok: false, normalized, error: msg };
  }
}
