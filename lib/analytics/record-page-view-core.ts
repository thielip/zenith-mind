import { z } from "zod";
import { newPageViewId, sha256Hex } from "@/lib/analytics/visitor-hash";
import { isPublicCfBackend } from "@/lib/public-content/runtime";
import { supabaseInsert } from "@/lib/db/supabase-rest";
import type { SiteLocale } from "@/lib/site/types";

const schema = z.object({
  postId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().min(1).optional()
  ),
  locale: z.enum(["zh-TW", "en"]).default("zh-TW"),
  referer: z.string().max(500).optional(),
});

export type RecordPageViewInput = z.infer<typeof schema>;

function normalizeLocale(locale: string): SiteLocale {
  return locale === "en" ? "en" : "zh-TW";
}

async function visitorHashFromHeaders(
  headers: Headers,
  salt: string
): Promise<string> {
  const ip =
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const ua = headers.get("user-agent") ?? "";
  return sha256Hex(`${ip}${ua}${salt}`);
}

function resolveHashSalt(): string | null {
  const salt = process.env["PAGEVIEW_HASH_SALT"]?.trim();
  if (salt) return salt;
  if (process.env["NODE_ENV"] === "production") return null;
  return "zenith-dev-only";
}

export async function recordPageViewCore(
  input: unknown,
  headers: Headers
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "validation" };

  const hashSalt = resolveHashSalt();
  if (!hashSalt) return { ok: false, reason: "missing_salt" };

  const locale = normalizeLocale(parsed.data.locale);
  const visitorHash = await visitorHashFromHeaders(headers, hashSalt);
  const row = {
    id: newPageViewId(),
    postId: parsed.data.postId ?? null,
    locale,
    referer: parsed.data.referer ?? null,
    visitorHash,
  };

  if (isPublicCfBackend()) {
    try {
      await supabaseInsert("page_views", row);
      return { ok: true };
    } catch (e) {
      console.error("[PageView] Supabase insert failed:", e);
      return { ok: false, reason: "supabase_insert" };
    }
  }

  try {
    const { prisma } = await import("@/infrastructure/db/prisma");
    await prisma.pageView.create({
      data: {
        postId: row.postId,
        locale: row.locale,
        referer: row.referer,
        visitorHash: row.visitorHash,
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("[PageView] Prisma insert failed:", e);
    return { ok: false, reason: "prisma_insert" };
  }
}
