import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { normalizeServiceAccountPrivateKey } from "@/lib/google/normalize-private-key";

const GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

export function getServiceAccountCredentials() {
  const clientEmail = process.env["GA4_CLIENT_EMAIL"]?.trim();
  const privateKeyRaw = process.env["GA4_PRIVATE_KEY"]?.trim();
  if (!clientEmail || !privateKeyRaw) {
    return null;
  }
  return {
    client_email: clientEmail,
    private_key: normalizeServiceAccountPrivateKey(privateKeyRaw),
  };
}

export function createGoogleAuth(scopes: string[]) {
  const credentials = getServiceAccountCredentials();
  if (!credentials) return null;
  return new GoogleAuth({ credentials, scopes });
}

/**
 * Search Console 認證：優先 OAuth（繞過 GSC「找不到電子郵件」服務帳號 Bug），否則共用 GA4 服務帳號。
 * 環境變數：GSC_OAUTH_CLIENT_ID、GSC_OAUTH_CLIENT_SECRET、GSC_OAUTH_REFRESH_TOKEN
 */
export type SearchConsoleAuthMode = "oauth" | "service_account" | "none";

export function getSearchConsoleOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} | null {
  const refreshToken =
    process.env["GSC_OAUTH_REFRESH_TOKEN"]?.trim() ||
    process.env["GOOGLE_ADS_REFRESH_TOKEN"]?.trim();
  const clientId =
    process.env["GSC_OAUTH_CLIENT_ID"]?.trim() ||
    process.env["GOOGLE_ADS_CLIENT_ID"]?.trim();
  const clientSecret =
    process.env["GSC_OAUTH_CLIENT_SECRET"]?.trim() ||
    process.env["GOOGLE_ADS_CLIENT_SECRET"]?.trim();
  if (!refreshToken || !clientId || !clientSecret) return null;
  return { clientId, clientSecret, refreshToken };
}

export function getSearchConsoleAuthMode(): SearchConsoleAuthMode {
  if (getSearchConsoleOAuthCredentials()) return "oauth";
  if (getServiceAccountCredentials()) return "service_account";
  return "none";
}

export function createSearchConsoleAuth(): GoogleAuth | OAuth2Client | null {
  const oauth = getSearchConsoleOAuthCredentials();

  if (oauth) {
    const { clientId, clientSecret, refreshToken } = oauth;
    const oauth2 = new OAuth2Client({ clientId, clientSecret });
    oauth2.setCredentials({ refresh_token: refreshToken });
    return oauth2;
  }

  return createGoogleAuth(GSC_SCOPES);
}
