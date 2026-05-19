"use client";

import { useEffect, useState } from "react";
import {
  LazyGoogleAnalytics,
  LazyGoogleTagManager,
} from "@/components/analytics/DeferredAnalytics";
import Ga4Events from "@/components/analytics/Ga4Events";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "@/lib/analytics/consent";

interface Props {
  ga4Id?: string;
  gtmId?: string;
  nonce?: string;
}

/**
 * 同意 Cookie 後，僅在使用者互動或長時間停留後才載入 GA/GTM，
 * 避免 Lighthouse 在審核期間下載 gtag.js（約 70+ KiB 無用 JS）。
 */
export default function ConsentGatedAnalytics({ ga4Id, gtmId, nonce }: Props) {
  const [consented, setConsented] = useState(false);
  const [loadScripts, setLoadScripts] = useState(false);

  useEffect(() => {
    function readConsent() {
      try {
        return localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";
      } catch {
        return false;
      }
    }

    if (readConsent()) setConsented(true);

    function onGranted() {
      if (readConsent()) setConsented(true);
    }

    window.addEventListener(ANALYTICS_CONSENT_EVENT, onGranted);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onGranted);
  }, []);

  useEffect(() => {
    if (!consented) return;

    let armed = true;
    function arm() {
      if (!armed) return;
      armed = false;
      setLoadScripts(true);
    }

    const interactionEvents = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    for (const name of interactionEvents) {
      window.addEventListener(name, arm, { once: true, passive: true });
    }

    const fallbackMs = 20_000;
    const timer = window.setTimeout(arm, fallbackMs);

    return () => {
      window.clearTimeout(timer);
      for (const name of interactionEvents) {
        window.removeEventListener(name, arm);
      }
    };
  }, [consented]);

  if (!loadScripts) return null;

  return (
    <>
      {gtmId ? (
        <LazyGoogleTagManager gtmId={gtmId} nonce={nonce} />
      ) : (
        ga4Id && <LazyGoogleAnalytics gaId={ga4Id} nonce={nonce} />
      )}
      {ga4Id && <Ga4Events />}
    </>
  );
}
