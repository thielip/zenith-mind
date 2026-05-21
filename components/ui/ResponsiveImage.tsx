import Image, { type ImageProps } from "next/image";
import type { BuildSupabaseSrcSetOptions } from "@/lib/images/supabase-render";
import { buildDeliverySrcSet, shouldUseSupabaseRender } from "@/lib/images/delivery";

type Props = Omit<ImageProps, "src"> & {
  src: string;
  /** 產生 srcSet 的寬度列表（supabase-render 模式） */
  responsiveWidths?: number[];
  quality?: number;
  /** Supabase srcSet 進階選項（fallback 寬度、依寬度算高等） */
  supabaseSrcSetOptions?: Omit<BuildSupabaseSrcSetOptions, "quality">;
};

/**
 * 公開站：Supabase render（WebP + 正確寬度 + 邊緣快取）
 * Vercel／本機：next/image 最佳化
 */
export default function ResponsiveImage({
  src,
  responsiveWidths,
  quality = 75,
  supabaseSrcSetOptions,
  sizes,
  priority,
  fetchPriority,
  unoptimized,
  alt,
  className,
  fill,
  width,
  height,
  ...rest
}: Props) {
  const useCdn = shouldUseSupabaseRender(src);

  if (useCdn) {
    const widths =
      responsiveWidths ??
      (fill ? [640, 828, 1080, 1400] : [typeof width === "number" ? width * 2 : 256]);
    const { src: cdnSrc, srcSet } = buildDeliverySrcSet(src, widths, {
      quality,
      ...supabaseSrcSetOptions,
    });

    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- 刻意走 Supabase CDN 轉檔
        <img
          src={cdnSrc}
          srcSet={srcSet || undefined}
          sizes={typeof sizes === "string" ? sizes : "100vw"}
          alt={alt ?? ""}
          className={className}
          decoding={priority ? "sync" : "async"}
          fetchPriority={fetchPriority ?? (priority ? "high" : "auto")}
          loading={priority ? "eager" : "lazy"}
          style={{
            position: "absolute",
            height: "100%",
            width: "100%",
            inset: 0,
          }}
          {...rest}
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element -- Supabase render CDN；公開站 CF 不使用 /_next/image
      <img
        src={cdnSrc}
        srcSet={srcSet || undefined}
        sizes={typeof sizes === "string" ? sizes : undefined}
        alt={alt ?? ""}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
        className={className}
        decoding={priority ? "sync" : "async"}
        fetchPriority={fetchPriority ?? (priority ? "high" : "auto")}
        loading={priority ? "eager" : "lazy"}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? ""}
      sizes={sizes}
      priority={priority}
      fetchPriority={fetchPriority}
      unoptimized={
        unoptimized ??
        (src.endsWith(".svg") || (src.startsWith("http") && !useCdn))
      }
      className={className}
      fill={fill}
      width={width}
      height={height}
      quality={quality}
      {...rest}
    />
  );
}
