"use client";

import { useEffect, useRef } from "react";
import { recordPageViewClient } from "@/lib/analytics/record-page-view-client";
import { HOMEPAGE_VIEW_RECORDED } from "@/lib/analytics/homepage-view-event";
import type { SiteLocale } from "@/lib/site/types";

/** 每次完整載入首頁記錄 PageView；以事件更新數字，避免 router.refresh 造成 CLS */
export default function HomePageViewTracker({ locale }: { locale: string }) {
  const siteLocale: SiteLocale = locale === "en" ? "en" : "zh-TW";
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    const record = () => {
      void (async () => {
        const ok = await recordPageViewClient({
          locale: siteLocale,
          referer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        });
        if (ok) {
          window.dispatchEvent(new Event(HOMEPAGE_VIEW_RECORDED));
        }
      })();
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(record, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }

    const t = window.setTimeout(record, 2000);
    return () => window.clearTimeout(t);
  }, [siteLocale]);

  return null;
}
