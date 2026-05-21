// infrastructure/health/probes.ts — 管理後台用連線探測（勿回傳 secret）

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { prisma } from "@/infrastructure/db/prisma";
import { formatApiError } from "@/lib/admin/format-api-error";
import { fetchRealtimeActiveUsers } from "@/infrastructure/ga4/reporting.client";
import { redis } from "@/infrastructure/redis/client";
import { env } from "@/env";

const PROBE_TIMEOUT_MS = 15_000;
const SITE_ASSETS_BUCKET = "site-assets";
const GEMINI_COMPAT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";

export interface ProbeResult {
  ok: boolean;
  message?: string;
}

function sanitizeError(error: unknown): string {
  return formatApiError(error);
}

export function withProbeTimeout<T>(
  promise: Promise<T>,
  ms = PROBE_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("探測逾時")), ms);
    }),
  ]);
}

export async function probeDatabase(): Promise<ProbeResult> {
  try {
    await withProbeTimeout(prisma.$queryRaw`SELECT 1`);
    return { ok: true, message: "資料庫連線正常" };
  } catch (e) {
    return { ok: false, message: sanitizeError(e) };
  }
}

export async function probeRedis(): Promise<ProbeResult> {
  try {
    const pong = await withProbeTimeout(redis.ping());
    return { ok: true, message: `Redis PING：${String(pong)}` };
  } catch (e) {
    return { ok: false, message: sanitizeError(e) };
  }
}

export async function probeSupabaseStorage(): Promise<ProbeResult> {
  try {
    const client = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data, error } = await withProbeTimeout(
      client.storage.getBucket(SITE_ASSETS_BUCKET)
    );
    if (error) return { ok: false, message: sanitizeError(error) };
    if (!data) {
      return { ok: false, message: `Storage bucket「${SITE_ASSETS_BUCKET}」不存在` };
    }
    return { ok: true, message: `Storage bucket「${data.name}」可存取` };
  } catch (e) {
    return { ok: false, message: sanitizeError(e) };
  }
}

export async function probeGemini(): Promise<ProbeResult> {
  try {
    const client = new OpenAI({
      apiKey: env.GEMINI_API_KEY,
      baseURL: GEMINI_COMPAT_BASE_URL,
    });
    const models = await withProbeTimeout(client.models.list(), 25_000);
    const count = models.data?.length ?? 0;
    return { ok: true, message: `Gemini 相容 API 可連線（模型列表 ${count} 筆）` };
  } catch (e) {
    return { ok: false, message: sanitizeError(e) };
  }
}

export async function probeGa4Reporting(): Promise<ProbeResult> {
  try {
    const users = await withProbeTimeout(fetchRealtimeActiveUsers());
    return { ok: true, message: `Reporting API 正常（即時使用者 ${users}）` };
  } catch (e) {
    return { ok: false, message: sanitizeError(e) };
  }
}

export async function probeGoogleAdsOAuth(): Promise<ProbeResult> {
  const clientId = process.env["GOOGLE_ADS_CLIENT_ID"]?.trim();
  const clientSecret = process.env["GOOGLE_ADS_CLIENT_SECRET"]?.trim();
  const refreshToken = process.env["GOOGLE_ADS_REFRESH_TOKEN"]?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, message: "OAuth 變數未齊全" };
  }

  try {
    const res = await withProbeTimeout(
      fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      })
    );
    const body = (await res.json()) as { access_token?: string; error?: string };
    if (!res.ok || !body.access_token) {
      return {
        ok: false,
        message: body.error ?? `Token 交換失敗（HTTP ${res.status}）`,
      };
    }
    return { ok: true, message: "Refresh Token 可換取 Access Token" };
  } catch (e) {
    return { ok: false, message: sanitizeError(e) };
  }
}
