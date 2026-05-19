/** Supabase PostgREST（fetch only，Edge / Worker 安全） */

import { assertAllowedSupabaseTable } from "@/lib/db/supabase-rest-tables";

export type SupabaseFetchCache =
  /** 公開內容：配合頁面 revalidate=3600，降低重複 egress */
  | { kind: "public"; revalidate?: number; tags?: string[] }
  /** 即時讀取（轉址查詢等） */
  | { kind: "fresh" };

/** 預設公開頁 ISR（1 小時） */
export const SUPABASE_PUBLIC_CACHE: SupabaseFetchCache = {
  kind: "public",
  revalidate: 3600,
};

export class SupabaseRestError extends Error {
  readonly status: number;
  readonly table: string;

  constructor(table: string, status: number, detail: string) {
    super(`Supabase REST ${table} failed: ${status}${detail ? ` — ${detail}` : ""}`);
    this.name = "SupabaseRestError";
    this.status = status;
    this.table = table;
  }
}

export function isSupabaseRestError(error: unknown): error is SupabaseRestError {
  return error instanceof SupabaseRestError;
}

export function isSupabaseAuthOrForbidden(error: unknown): boolean {
  if (!isSupabaseRestError(error)) return false;
  return error.status === 401 || error.status === 403;
}

type SupabaseRestConfig = { base: string; key: string };

export function getSupabaseRestConfig(): SupabaseRestConfig | null {
  const base = process.env["NEXT_PUBLIC_SUPABASE_URL"]?.trim();
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!base || !key) return null;
  return { base: base.replace(/\/$/, ""), key };
}

function restHeaders(
  cfg: SupabaseRestConfig,
  extra?: HeadersInit
): HeadersInit {
  const headers: Record<string, string> = {
    apikey: cfg.key,
    Accept: "application/json",
    "Accept-Profile": "public",
    "Content-Profile": "public",
  };

  // PostgREST：apikey 必填；Bearer 與 apikey 相同時，sb_secret_ / eyJ 皆可使用
  headers.Authorization = `Bearer ${cfg.key}`;

  return { ...headers, ...(extra as Record<string, string> | undefined) };
}

function mergeFetchInit(
  init: RequestInit | undefined,
  cachePolicy: SupabaseFetchCache
): RequestInit {
  if (cachePolicy.kind === "fresh") {
    return { ...init, cache: "no-store" };
  }

  const revalidate = cachePolicy.revalidate ?? 3600;
  const next: { revalidate: number; tags?: string[] } = { revalidate };
  if (cachePolicy.tags?.length) next.tags = cachePolicy.tags;

  return {
    ...init,
    next,
  };
}

function logSupabaseFailure(
  table: string,
  status: number,
  detail: string,
  usingFallback: boolean
): void {
  const msg = `[supabase-rest] ${table} HTTP ${status}${usingFallback ? " (fallback)" : ""}${detail ? `: ${detail.slice(0, 200)}` : ""}`;
  if (process.env.NODE_ENV === "development") {
    console.warn(msg);
  } else {
    console.error(msg);
  }
}

export async function supabaseRest<T>(
  table: string,
  params: Record<string, string>,
  init?: RequestInit,
  cachePolicy: SupabaseFetchCache = SUPABASE_PUBLIC_CACHE
): Promise<T> {
  assertAllowedSupabaseTable(table);
  const cfg = getSupabaseRestConfig();
  if (!cfg) {
    throw new SupabaseRestError(table, 0, "Supabase REST is not configured");
  }

  const url = new URL(`${cfg.base}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      ...mergeFetchInit(init, cachePolicy),
      headers: restHeaders(cfg, init?.headers as HeadersInit | undefined),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new SupabaseRestError(table, 0, detail);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logSupabaseFailure(table, res.status, detail, false);
    throw new SupabaseRestError(table, res.status, detail);
  }

  return (await res.json()) as T;
}

/**
 * 熔斷保護：403／連線失敗時回傳 fallback，避免公開頁全站崩潰。
 * 成功路徑仍走 ISR fetch cache（cachePolicy）。
 */
export async function supabaseRestWithFallback<T>(
  table: string,
  params: Record<string, string>,
  fallback: T,
  init?: RequestInit,
  cachePolicy: SupabaseFetchCache = SUPABASE_PUBLIC_CACHE
): Promise<T> {
  try {
    return await supabaseRest<T>(table, params, init, cachePolicy);
  } catch (error) {
    const status = isSupabaseRestError(error) ? error.status : 0;
    const detail = error instanceof Error ? error.message : String(error);
    logSupabaseFailure(table, status, detail, true);
    return fallback;
  }
}

/** PostgREST Prefer: count=exact → Content-Range: 0-0/N */
export async function supabaseCount(
  table: string,
  params: Record<string, string>,
  cachePolicy: SupabaseFetchCache = SUPABASE_PUBLIC_CACHE
): Promise<number> {
  assertAllowedSupabaseTable(table);
  const cfg = getSupabaseRestConfig();
  if (!cfg) {
    console.error(`[supabase-rest] ${table} count skipped: not configured`);
    return 0;
  }

  const url = new URL(`${cfg.base}/rest/v1/${table}`);
  url.searchParams.set("select", "id");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "HEAD",
      ...mergeFetchInit(undefined, cachePolicy),
      headers: restHeaders(cfg, { Prefer: "count=exact" }),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[supabase-rest] ${table} count failed: ${detail}`);
    return 0;
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logSupabaseFailure(table, res.status, detail, true);
    return 0;
  }

  const range = res.headers.get("content-range") ?? res.headers.get("Content-Range");
  const total = range?.split("/")[1];
  const n = parseInt(total ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

/** PostgREST INSERT（service_role；不經過 ISR 快取） */
export async function supabaseInsert(
  table: string,
  row: Record<string, unknown>
): Promise<void> {
  assertAllowedSupabaseTable(table);
  const cfg = getSupabaseRestConfig();
  if (!cfg) {
    throw new SupabaseRestError(table, 0, "Supabase REST is not configured");
  }

  const url = `${cfg.base}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: restHeaders(cfg, {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logSupabaseFailure(table, res.status, detail, false);
    throw new SupabaseRestError(table, res.status, detail);
  }
}
