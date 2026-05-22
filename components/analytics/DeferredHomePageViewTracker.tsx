"use client";

import dynamic from "next/dynamic";

const HomePageViewTracker = dynamic(
  () => import("@/components/analytics/HomePageViewTracker"),
  { ssr: false }
);

export default function DeferredHomePageViewTracker({
  locale,
}: {
  locale: string;
}) {
  return <HomePageViewTracker locale={locale} />;
}
