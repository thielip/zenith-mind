/**
 * 輕量 GSC 探測：直接 fetch + AbortSignal（避免 googleapis 無逾時在 serverless 卡住）
 */
import { createSign } from "node:crypto";
import {
  getSearchConsoleAuthMode,
  getSearchConsoleOAuthCredentials,
  getServiceAccountCredentials,
} from "./auth";
import { normalizeGscSiteUrl } from "@/lib/google/gsc-site-url";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_TIMEOUT_MS = 10_000;
const API_TIMEOUT_MS = 12_000;

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("GSC API 請求逾時");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function exchangeOAuthAccessToken(): Promise<string> {
  const oauth = getSearchConsoleOAuthCredentials();
  if (!oauth) throw new Error("OAuth 憑證未設定");

  const res = await fetchWithTimeout(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: oauth.clientId,
        client_secret: oauth.clientSecret,
        refresh_token: oauth.refreshToken,
        grant_type: "refresh_token",
      }),
    },
    TOKEN_TIMEOUT_MS
  );

  const body = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !body.access_token) {
    const detail = body.error_description?.trim() || body.error;
    throw new Error(detail ?? `OAuth token 交換失敗（HTTP ${res.status}）`);
  }
  return body.access_token;
}

async function exchangeServiceAccountAccessToken(): Promise<string> {
  const credentials = getServiceAccountCredentials();
  if (!credentials) throw new Error("服務帳號未設定");

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: GSC_SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = b64url(sign.sign(credentials.private_key));
  const jwt = `${unsigned}.${signature}`;

  const res = await fetchWithTimeout(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    },
    TOKEN_TIMEOUT_MS
  );

  const body = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !body.access_token) {
    const detail = body.error_description?.trim() || body.error;
    throw new Error(detail ?? `服務帳號 token 失敗（HTTP ${res.status}）`);
  }
  return body.access_token;
}

async function fetchGscSitePermission(
  siteUrl: string,
  accessToken: string
): Promise<string> {
  const encoded = encodeURIComponent(siteUrl);
  const res = await fetchWithTimeout(
    `https://www.googleapis.com/webmasters/v3/sites/${encoded}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    API_TIMEOUT_MS
  );

  const text = await res.text();
  let body: { permissionLevel?: string; error?: { message?: string } };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    body = {};
  }

  if (!res.ok) {
    const msg =
      body.error?.message?.trim() ||
      text.slice(0, 160).trim() ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return body.permissionLevel ?? "unknown";
}

export async function probeSearchConsoleRest(): Promise<{
  ok: boolean;
  message?: string;
}> {
  const siteUrl = normalizeGscSiteUrl(process.env["GOOGLE_SEARCH_CONSOLE_SITE_URL"]);
  if (!siteUrl) {
    return {
      ok: false,
      message: "未設定 GOOGLE_SEARCH_CONSOLE_SITE_URL（例：https://www.getzenithmind.com/）",
    };
  }

  const mode = getSearchConsoleAuthMode();
  if (mode === "none") {
    return {
      ok: false,
      message:
        "未設定 GSC 認證：請設 GSC_OAUTH_*（建議）或 GA4_CLIENT_EMAIL + GA4_PRIVATE_KEY",
    };
  }

  try {
    const accessToken =
      mode === "oauth"
        ? await exchangeOAuthAccessToken()
        : await exchangeServiceAccountAccessToken();
    const level = await fetchGscSitePermission(siteUrl, accessToken);
    return { ok: true, message: `GSC 可存取 ${siteUrl}（${level}）` };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search Console API 失敗";
    return { ok: false, message };
  }
}
