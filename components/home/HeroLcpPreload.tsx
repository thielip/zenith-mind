import { preload } from "react-dom";
import { getHeroDeliverySources } from "@/lib/images/hero-delivery";

/** @deprecated 首頁請用 HeroBlock + HeroLcpLinks（RSC head preload） */
export function heroLcpPreload(imageUrl: string): void {
  if (!imageUrl) return;
  const { src, srcSet, sizes } = getHeroDeliverySources(imageUrl);
  preload(src, {
    as: "image",
    imageSrcSet: srcSet || undefined,
    imageSizes: sizes,
    fetchPriority: "high",
  });
}
