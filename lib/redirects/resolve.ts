import { permanentRedirect } from "next/navigation";
import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import { postArticlePath, type PublicLocale } from "@/lib/redirects/paths";
import { findActiveRedirectViaSupabase } from "@/lib/redirects/edge-lookup";
import { findActiveRedirect } from "@/lib/redirects/queries";

function toPublicLocale(locale: string): PublicLocale {
  return locale === "en" ? "en" : "zh-TW";
}

/** 文章已封存時，若 DB 有轉址規則則 308 導向（middleware 301 失敗時的備援） */
export async function redirectArchivedPostIfNeeded(
  locale: string,
  slug: string
): Promise<void> {
  try {
    const from = postArticlePath(toPublicLocale(locale), slug);
    const hit = isCfPublicRuntime()
      ? await findActiveRedirectViaSupabase(from)
      : await findActiveRedirect(from);
    if (!hit) return;

    permanentRedirect(hit.newPath);
  } catch (error) {
    console.error("[redirect] redirectArchivedPostIfNeeded failed", error);
  }
}
