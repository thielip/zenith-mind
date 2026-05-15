// infrastructure/http/fetch.client.ts
// 全域 fetch 封裝（Promise Lock 防 Race Condition）
// 多個請求同時 401 時，只發一次 /api/auth/refresh，其餘等待

"use client";

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    refreshPromise = null;
  }
}

/**
 * 全域 fetch 封裝
 * - 401 時自動觸發 silent refresh（Promise Lock 防競態）
 * - refresh 失敗 → 清除 cookie，redirect 到登入頁
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: "include" });

  if (res.status !== 401) return res;

  // ── 401：觸發 silent refresh（Promise Lock）────────────
  if (!refreshPromise) {
    refreshPromise = doRefresh();
  }

  const refreshed = await refreshPromise;

  if (!refreshed) {
    // Refresh Token 過期或已撤銷 → 導向登入頁
    const currentPath = window.location.pathname;
    window.location.href = `/admin/login?redirect=${encodeURIComponent(currentPath)}&reason=session_expired`;
    // 回傳原始 401 response，讓呼叫者知道發生了什麼
    return res;
  }

  // 使用新 Token 重試原始請求
  return fetch(input, { ...init, credentials: "include" });
}
