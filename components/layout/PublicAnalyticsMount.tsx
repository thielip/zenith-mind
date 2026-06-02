"use client";

import dynamic from "next/dynamic";

const DeferredConsentBanner = dynamic(
  () => import("@/components/analytics/ConsentBanner"),
  { ssr: false }
);
const DeferredConsentGatedAnalytics = dynamic(
  () => import("@/components/analytics/ConsentGatedAnalytics"),
  { ssr: false }
);

type Props = {
  ga4Id?: string;
  gtmId?: string;
  nonce?: string;
};

export default function PublicAnalyticsMount({ ga4Id, gtmId, nonce }: Props) {
  return (
    <>
      <DeferredConsentBanner />
      <DeferredConsentGatedAnalytics ga4Id={ga4Id} gtmId={gtmId} nonce={nonce} />
    </>
  );
}

