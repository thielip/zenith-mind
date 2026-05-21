/** Supabase Storage 圖片轉換（WebP + 縮放），Cloudflare 公開站優先使用，避免 /_next/image 延遲與無快取 */

export function isSupabaseStorageUrl(src: string): boolean {
  try {
    return new URL(src).hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export type SupabaseRenderOptions = {
  width: number;
  height?: number;
  quality?: number;
};

export type BuildSupabaseSrcSetOptions = {
  quality?: number;
  /** img src 後備寬度（預設為 widths 中位，勿用最大值） */
  fallbackWidth?: number;
  heightForWidth?: (width: number) => number;
};

export function supabaseRenderImageUrl(
  objectPublicUrl: string,
  options: SupabaseRenderOptions
): string {
  if (!isSupabaseStorageUrl(objectPublicUrl)) return objectPublicUrl;

  const u = new URL(objectPublicUrl);
  const objectPrefix = "/storage/v1/object/public/";
  const renderPrefix = "/storage/v1/render/image/public/";

  if (!u.pathname.includes(objectPrefix)) return objectPublicUrl;

  u.pathname = u.pathname.replace(objectPrefix, renderPrefix);
  u.search = "";
  u.searchParams.set("width", String(Math.round(options.width)));
  u.searchParams.set("quality", String(options.quality ?? 68));
  if (options.height) {
    u.searchParams.set("height", String(Math.round(options.height)));
  }
  u.searchParams.set("resize", "cover");
  u.searchParams.set("format", "webp");

  return u.toString();
}

export function buildSupabaseSrcSet(
  objectPublicUrl: string,
  widths: number[],
  qualityOrOptions: number | BuildSupabaseSrcSetOptions = 68
): { src: string; srcSet: string } {
  const opts: BuildSupabaseSrcSetOptions =
    typeof qualityOrOptions === "number" ? { quality: qualityOrOptions } : qualityOrOptions;
  const quality = opts.quality ?? 75;
  const sorted = [...widths].filter((w) => w > 0).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { src: objectPublicUrl, srcSet: "" };
  }

  const renderAt = (w: number) =>
    supabaseRenderImageUrl(objectPublicUrl, {
      width: w,
      height: opts.heightForWidth?.(w),
      quality,
    });

  const srcSet = sorted.map((w) => `${renderAt(w)} ${w}w`).join(", ");

  const midIndex = Math.min(
    Math.max(1, Math.floor(sorted.length / 2)),
    sorted.length - 1
  );
  const fallback =
    opts.fallbackWidth ?? sorted[midIndex] ?? sorted[0];
  if (fallback === undefined) {
    return { src: objectPublicUrl, srcSet };
  }
  const src = renderAt(fallback);

  return { src, srcSet };
}
