"use client";

import { useEffect } from "react";
import { recordPageViewAction } from "@/actions/analytics.actions";

interface Props {
  postId: string;
  locale: string;
}

export default function PageViewTracker({ postId, locale }: Props) {
  useEffect(() => {
    const key = `pageview:${postId}`;
    const lastViewed = Number(sessionStorage.getItem(key) ?? "0");
    const now = Date.now();
    if (now - lastViewed < 30 * 60 * 1000) return;

    sessionStorage.setItem(key, String(now));
    void recordPageViewAction({
      postId,
      locale,
      referer: document.referrer || undefined,
    });
  }, [postId, locale]);

  return null;
}
