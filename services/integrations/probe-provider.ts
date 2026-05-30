import { fetchGa4DashboardBundle } from "@/infrastructure/ga4/dashboard-bundle";
import { probeGemini, probeGoogleAdsOAuth, probeSearchConsole } from "@/infrastructure/health/probes";
import { fetchBigQueryHealth } from "@/services/google/bigquery";
import type { IntegrationProviderId } from "@/lib/integrations/providers";
export async function probeIntegrationProvider(
  provider: IntegrationProviderId
): Promise<{ ok: boolean; message: string }> {
  switch (provider) {
      case "ga4": {
        const bundle = await fetchGa4DashboardBundle();
        return {
          ok: bundle.reportingProbe.ok,
          message: bundle.reportingProbe.message ?? "GA4 探測完成",
        };
      }
      case "gemini": {
        const r = await probeGemini();
        return { ok: r.ok, message: r.message ?? "Gemini 探測完成" };
      }
      case "google_ads": {
        const r = await probeGoogleAdsOAuth();
        return { ok: r.ok, message: r.message ?? "Ads OAuth 探測完成" };
      }
      case "search_console": {
        const r = await probeSearchConsole();
        return {
          ok: r.ok,
          message: r.message ?? "Search Console 探測完成",
        };
      }
      case "bigquery": {
        const r = await fetchBigQueryHealth();
        return { ok: r.ok, message: r.message };
      }
      case "merchant": {
        const id = process.env["GOOGLE_MERCHANT_CENTER_ACCOUNT_ID"]?.trim();
        return id
          ? { ok: true, message: `Merchant ID：${id}` }
          : { ok: false, message: "缺少 Merchant 帳戶 ID" };
      }
      default:
        return { ok: false, message: "未知整合" };
  }
}
