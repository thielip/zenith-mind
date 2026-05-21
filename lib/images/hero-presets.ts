/** 首頁 Hero LCP：PSI 常見顯示約 643×560，勿在 >1024px 前選 1400w */
export const HERO_IMAGE_SIZES =
  "(max-width: 640px) min(100vw, 520px), (max-width: 1024px) min(100vw, 680px), 1200px";
export const HERO_IMAGE_WIDTHS = [400, 520, 640, 680, 960, 1200] as const;
export const HERO_IMAGE_QUALITY = 58;
export const HERO_FALLBACK_WIDTH = 640;

export function heroRenderHeightForWidth(width: number): number {
  return Math.round(width * (560 / 643));
}
