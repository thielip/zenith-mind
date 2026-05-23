"use client";

import dynamic from "next/dynamic";
import type { SiteSettingsData } from "@/lib/site/types";

const SocialSidebar = dynamic(() => import("@/components/layout/SocialSidebar"), {
  ssr: false,
  loading: () => null,
});

const BackToTop = dynamic(() => import("@/components/layout/BackToTop"), {
  ssr: false,
});

export function DeferredSocialSidebar(props: { settings: SiteSettingsData; locale: string }) {
  return <SocialSidebar {...props} />;
}

export function DeferredBackToTop(props: { locale: string }) {
  return <BackToTop {...props} />;
}
