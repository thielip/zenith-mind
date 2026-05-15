// components/analytics/SilentRefresh.tsx — Client Component
// 後台：Access 到期前自動 refresh；連續閒置 1 小時則登出

"use client";

import { useEffect, useCallback, useRef } from "react";
import { clearAdminSessionHint } from "@/lib/auth/client-session";
import {
  ADMIN_IDLE_TIMEOUT_MS,
  REFRESH_BEFORE_EXPIRY_SEC,
  SESSION_PING_INTERVAL_MS,
} from "@/lib/auth/constants";

const IDLE_ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

function redirectToLogin(reason: string) {
  clearAdminSessionHint();
  const path = window.location.pathname;
  window.location.href = `/admin/login?redirect=${encodeURIComponent(path)}&reason=${reason}`;
}

export default function SilentRefresh() {
  const lastActivityRef = useRef(Date.now());

  const touchActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const doRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const checkAndRefresh = useCallback(async () => {
    if (!window.location.pathname.startsWith("/admin")) return;
    if (window.location.pathname.startsWith("/admin/login")) return;
    if (window.location.pathname.startsWith("/admin/totp")) return;

    const idleMs = Date.now() - lastActivityRef.current;
    if (idleMs >= ADMIN_IDLE_TIMEOUT_MS) {
      redirectToLogin("idle_timeout");
      return;
    }

    try {
      const res = await fetch("/api/auth/ping", { credentials: "include" });
      if (res.status === 401) {
        const ok = await doRefresh();
        if (!ok) redirectToLogin("session_expired");
        return;
      }

      if (res.ok) {
        const data = (await res.json()) as { remainingSeconds?: number };
        if (
          typeof data.remainingSeconds === "number" &&
          data.remainingSeconds < REFRESH_BEFORE_EXPIRY_SEC
        ) {
          const ok = await doRefresh();
          if (!ok) redirectToLogin("session_expired");
        }
      }
    } catch {
      // 網路錯誤不影響 UX
    }
  }, [doRefresh]);

  useEffect(() => {
    if (!window.location.pathname.startsWith("/admin")) return;

    for (const event of IDLE_ACTIVITY_EVENTS) {
      window.addEventListener(event, touchActivity, { passive: true });
    }
    touchActivity();

    const timer = setInterval(() => {
      void checkAndRefresh();
    }, SESSION_PING_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      for (const event of IDLE_ACTIVITY_EVENTS) {
        window.removeEventListener(event, touchActivity);
      }
    };
  }, [checkAndRefresh, touchActivity]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsaved = (window as Window & { __hasUnsavedData?: boolean }).__hasUnsavedData;
      if (!hasUnsaved) return;
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return null;
}
