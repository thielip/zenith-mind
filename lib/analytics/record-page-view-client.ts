import type { SiteLocale } from "@/lib/site/types";

export type ClientPageViewPayload = {
  postId?: string;
  locale: SiteLocale;
  referer?: string;
};

/** 公開站（含 Cloudflare Worker）寫入瀏覽紀錄 */
export async function recordPageViewClient(payload: ClientPageViewPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/public/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}
