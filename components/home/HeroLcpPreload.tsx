import { preload } from "react-dom";
import { buildDeliverySrcSet, shouldUseSupabaseRender } from "@/lib/images/delivery";
import {
  HERO_FALLBACK_WIDTH,
  HERO_IMAGE_QUALITY,
  HERO_IMAGE_SIZES,
  HERO_IMAGE_WIDTHS,
  heroRenderHeightForWidth,
} from "@/lib/images/hero-presets";
import { getImageProps } from "next/image";

/** 在 HTML 解析早期 preload LCP 圖，縮短「資源載入延遲」 */
export function heroLcpPreload(imageUrl: string, title: string): void {
  if (!imageUrl) return;

  if (shouldUseSupabaseRender(imageUrl)) {
    const { src, srcSet } = buildDeliverySrcSet(imageUrl, [...HERO_IMAGE_WIDTHS], {
      quality: HERO_IMAGE_QUALITY,
      fallbackWidth: HERO_FALLBACK_WIDTH,
      heightForWidth: heroRenderHeightForWidth,
    });
    preload(src, {
      as: "image",
      imageSrcSet: srcSet || undefined,
      imageSizes: HERO_IMAGE_SIZES,
      fetchPriority: "high",
    });
    return;
  }

  const { props } = getImageProps({
    src: imageUrl,
    alt: title,
    width: HERO_FALLBACK_WIDTH,
    height: heroRenderHeightForWidth(HERO_FALLBACK_WIDTH),
    sizes: HERO_IMAGE_SIZES,
    quality: HERO_IMAGE_QUALITY,
    priority: true,
  });
  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority: "high",
  });
}
