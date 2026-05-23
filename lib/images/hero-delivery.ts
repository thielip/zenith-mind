import { getImageProps } from "next/image";
import { buildDeliverySrcSet, shouldUseSupabaseRender } from "@/lib/images/delivery";
import {
  HERO_FALLBACK_WIDTH,
  HERO_IMAGE_QUALITY,
  HERO_IMAGE_SIZES,
  HERO_IMAGE_WIDTHS,
  heroRenderHeightForWidth,
} from "@/lib/images/hero-presets";

export type HeroDeliverySources = {
  src: string;
  srcSet: string;
  sizes: string;
};

/** Hero / LCP：Supabase render 或 next/image 產物，供 RSC 與 preload 共用 */
export function getHeroDeliverySources(imageUrl: string): HeroDeliverySources {
  if (shouldUseSupabaseRender(imageUrl)) {
    const { src, srcSet } = buildDeliverySrcSet(imageUrl, [...HERO_IMAGE_WIDTHS], {
      quality: HERO_IMAGE_QUALITY,
      fallbackWidth: HERO_FALLBACK_WIDTH,
      heightForWidth: heroRenderHeightForWidth,
    });
    return { src, srcSet, sizes: HERO_IMAGE_SIZES };
  }

  const { props } = getImageProps({
    src: imageUrl,
    alt: "",
    width: HERO_FALLBACK_WIDTH,
    height: heroRenderHeightForWidth(HERO_FALLBACK_WIDTH),
    sizes: HERO_IMAGE_SIZES,
    quality: HERO_IMAGE_QUALITY,
    priority: true,
  });

  return {
    src: props.src,
    srcSet: props.srcSet ?? "",
    sizes: typeof props.sizes === "string" ? props.sizes : HERO_IMAGE_SIZES,
  };
}
