/** 僅在 gtag 已載入後推送事件，避免 @next/third-parties 提前拉取 gtag.js */

export function sendGa4Event(eventName: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const gtag = (
    window as Window & { gtag?: (...args: unknown[]) => void }
  ).gtag;

  if (typeof gtag === "function") {
    gtag("event", eventName, params);
    return;
  }

  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push(["event", eventName, params]);
  }
}
