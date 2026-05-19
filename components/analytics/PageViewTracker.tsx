"use client";

import { useEffect } from "react";
import { recordPageViewClient } from "@/lib/analytics/record-page-view-client";
import type { SiteLocale } from "@/lib/site/types";

interface Props {
  postId: string;
  locale: string;
}

export default function PageViewTracker({ postId, locale }: Props) {
  const siteLocale: SiteLocale = locale === "en" ? "en" : "zh-TW";

  useEffect(() => {
    const key = `pageview:${postId}`;
    const lastViewed = Number(sessionStorage.getItem(key) ?? "0");
    const now = Date.now();
    if (now - lastViewed < 30 * 60 * 1000) return;

    sessionStorage.setItem(key, String(now));
    void recordPageViewClient({
      postId,
      locale: siteLocale,
      referer: document.referrer || undefined,
    });
  }, [postId, siteLocale]);

  return null;
}
