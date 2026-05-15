"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";

export default function Ga4Events() {
  useEffect(() => {
    let hasSentScroll75 = false;

    function onScroll() {
      if (hasSentScroll75) return;
      const doc = document.documentElement;
      const totalScrollable = doc.scrollHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const percent = (window.scrollY / totalScrollable) * 100;
      if (percent >= 75) {
        hasSentScroll75 = true;
        sendGAEvent("event", "scroll_75", { percent: 75 });
      }
    }

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href) return;

      const isAffiliate = href.startsWith("/go/");
      if (isAffiliate) {
        sendGAEvent("event", "click_affiliate", {
          affiliate_path: href,
          link_text: anchor.textContent?.trim() ?? "",
        });
      }

      if (href.startsWith("http://") || href.startsWith("https://")) {
        try {
          const url = new URL(href);
          if (url.hostname !== window.location.hostname) {
            sendGAEvent("event", "outbound_click", {
              destination: url.href,
              link_text: anchor.textContent?.trim() ?? "",
            });
          }
        } catch {
          // ignore invalid URL
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
