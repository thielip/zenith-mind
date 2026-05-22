import { preload } from "react-dom";
import { buildDeliverySrcSet, shouldUseSupabaseRender } from "@/lib/images/delivery";
import { resolveSiteLogoSrc } from "@/lib/site/brand";
import { getImageProps } from "next/image";

/** Header LCP logo：提早 preload，避免 duk.tw 等失效圖床拖慢首屏 */
export function logoPreload(logoUrl: string | null | undefined): void {
  const src = resolveSiteLogoSrc(logoUrl);
  if (!src) return;

  if (shouldUseSupabaseRender(src)) {
    const { src: cdnSrc, srcSet } = buildDeliverySrcSet(src, [106, 132, 168, 212], 72);
    preload(cdnSrc, {
      as: "image",
      imageSrcSet: srcSet || undefined,
      imageSizes: "106px",
      fetchPriority: "high",
    });
    return;
  }

  if (src.startsWith("/")) {
    preload(src, { as: "image", fetchPriority: "high" });
    return;
  }

  const { props } = getImageProps({
    src,
    alt: "logo",
    width: 106,
    height: 32,
    sizes: "106px",
    quality: 72,
    priority: true,
  });
  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority: "high",
  });
}
