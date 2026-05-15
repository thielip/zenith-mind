"use client";

import { useEffect } from "react";
import { recordPageViewAction } from "@/actions/analytics.actions";

/**
 * 每次完整載入首頁（含 F5）記錄一次 PageView（postId 為空），
 * 不使用 session 去重；與文章頁 PageViewTracker 行為不同。
 */
export default function HomePageViewTracker({ locale }: { locale: string }) {
  useEffect(() => {
    void recordPageViewAction({
      locale,
      referer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });
  }, [locale]);

  return null;
}
