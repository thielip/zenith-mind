// lib/security/allowed-media-url.ts — 封面／媒體 URL 僅允許 HTTPS 與受信任主機（防 SSRF / 惡意資源）

import { z } from "zod";

const TRUSTED_HOST_SUFFIXES = [
  ".supabase.co",
  "getzenithmind.com",
  "zenith-mind.vercel.app",
] as const;

export function isAllowedMediaUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return TRUSTED_HOST_SUFFIXES.some(
      (suffix) => host === suffix.replace(/^\./, "") || host.endsWith(suffix)
    );
  } catch {
    return false;
  }
}

export const optionalTrustedMediaUrl = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || isAllowedMediaUrl(v), {
    message: "Cover image must be HTTPS from an allowed host (Supabase Storage or site domain)",
  });
