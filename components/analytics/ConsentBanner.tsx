// components/analytics/ConsentBanner.tsx — Client Component
// GDPR / PDPA Consent Mode：使用者同意後才載入 Clarity

"use client";

import { useState, useEffect } from "react";

import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "@/lib/analytics/consent";

const CONSENT_KEY = ANALYTICS_CONSENT_KEY;

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
    if (consent === "granted") loadClarity();
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "granted");
    loadClarity();
    window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "denied");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie 同意通知"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg sm:flex sm:items-center sm:gap-4"
    >
      <p className="text-sm text-gray-600 sm:flex-1">
        我們使用 Cookie 及分析工具改善您的體驗。請確認您是否同意我們收集匿名瀏覽資料。
      </p>
      <div className="mt-3 flex gap-2 sm:mt-0 sm:shrink-0">
        <button
          onClick={decline}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          拒絕
        </button>
        <button
          onClick={accept}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          接受
        </button>
      </div>
    </div>
  );
}

function loadClarity() {
  const clarityId = process.env["NEXT_PUBLIC_CLARITY_ID"];
  if (!clarityId || document.querySelector(`script[data-clarity="${clarityId}"]`)) return;

  const append = () => {
    const script = document.createElement("script");
    script.setAttribute("data-clarity", clarityId);
    script.async = true;
    script.defer = true;
    // nonce 由 Middleware 注入到 meta tag，此處讀取
    const nonceMeta = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]');
    if (nonceMeta?.content) script.nonce = nonceMeta.content;
    script.src = `https://www.clarity.ms/tag/${clarityId}`;
    document.head.appendChild(script);
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(append, { timeout: 8000 });
  } else {
    globalThis.setTimeout(append, 1200);
  }
}
