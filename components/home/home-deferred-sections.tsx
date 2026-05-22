/**
 * 首頁非 LCP 區塊：dynamic import 拆 chunk，降低初始 JS 評估與長任務。
 * Hero / SocialProof 維持靜態 import（首屏）。
 */
import dynamic from "next/dynamic";
import { HomeSectionSkeleton } from "@/components/home/HomeSectionSkeleton";

const sk = (minHeight: string) =>
  function Loading() {
    return <HomeSectionSkeleton minHeight={minHeight} />;
  };

export const DeferredAdSlotBanner = dynamic(
  () => import("@/components/home/AdSlotBanner"),
  { loading: sk("min-h-[120px]") }
);

export const DeferredTopicClusterSection = dynamic(
  () => import("@/components/home/TopicClusterSection"),
  { loading: sk("min-h-[520px]") }
);

export const DeferredImageCarousel = dynamic(
  () => import("@/components/home/ImageCarousel"),
  { loading: sk("min-h-[420px]") }
);

export const DeferredFeaturedPostsSection = dynamic(
  () => import("@/components/home/FeaturedPostsSection"),
  { loading: sk("min-h-[640px]") }
);

export const DeferredHomeConversionBanner = dynamic(
  () => import("@/components/home/HomeConversionBanner"),
  { loading: sk("min-h-[200px]") }
);

export const DeferredMonetizationSection = dynamic(
  () => import("@/components/home/MonetizationSection"),
  { loading: sk("min-h-[360px]") }
);

export const DeferredAffiliateLinksSection = dynamic(
  () => import("@/components/home/AffiliateLinksSection"),
  { loading: sk("min-h-[280px]") }
);

export const DeferredProgrammaticSeoSection = dynamic(
  () => import("@/components/home/ProgrammaticSeoSection"),
  { loading: sk("min-h-[400px]") }
);
