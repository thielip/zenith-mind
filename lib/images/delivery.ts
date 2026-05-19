import {
  buildSupabaseSrcSet,
  isSupabaseStorageUrl,
  type BuildSupabaseSrcSetOptions,
} from "@/lib/images/supabase-render";

export type ImageDeliveryMode = "next" | "supabase-render";

/** Cloudflare 公開站預設走 Supabase 轉檔（wrangler.toml 可覆寫） */
export function getImageDeliveryMode(): ImageDeliveryMode {
  const v = process.env["NEXT_PUBLIC_IMAGE_DELIVERY"]?.trim();
  if (v === "next") return "next";
  if (v === "supabase-render") return "supabase-render";
  if (process.env["CF_WORKER_RUNTIME"] === "1") return "supabase-render";
  return "next";
}

export function shouldUseSupabaseRender(src: string): boolean {
  return getImageDeliveryMode() === "supabase-render" && isSupabaseStorageUrl(src);
}

export function buildDeliverySrcSet(
  src: string,
  widths: number[],
  qualityOrOptions: number | BuildSupabaseSrcSetOptions = 75
): { src: string; srcSet: string; mode: ImageDeliveryMode } {
  const mode = getImageDeliveryMode();
  if (mode === "supabase-render" && isSupabaseStorageUrl(src)) {
    return { ...buildSupabaseSrcSet(src, widths, qualityOrOptions), mode };
  }
  return { src, srcSet: "", mode: "next" };
}
