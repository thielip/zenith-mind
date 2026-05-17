import {
  getProviderDef,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import { getIntegrationPayload } from "./repository";

/** 將 DB 已啟用的整合覆寫到 process.env（僅限本次請求鏈） */
export async function applyConnectedIntegrations(
  providers?: IntegrationProviderId[]
) {
  const ids = providers ?? (["ga4", "gemini", "google_ads", "search_console", "bigquery", "merchant"] as IntegrationProviderId[]);

  for (const id of ids) {
    const payload = await getIntegrationPayload(id);
    if (!payload) continue;
    const def = getProviderDef(id);
    for (const key of def.envKeys) {
      const val = payload[key]?.trim();
      if (val) process.env[key] = val;
    }
  }
}

export async function withIntegrationValues<T>(
  values: Record<string, string>,
  envKeys: string[],
  fn: () => Promise<T>
): Promise<T> {
  const snapshot: Record<string, string | undefined> = {};
  for (const key of envKeys) {
    const val = values[key]?.trim();
    if (!val) continue;
    snapshot[key] = process.env[key];
    process.env[key] = val;
  }
  try {
    return await fn();
  } finally {
    for (const [key, prev] of Object.entries(snapshot)) {
      if (prev === undefined) delete process.env[key];
      else process.env[key] = prev;
    }
  }
}

export async function withIntegrationEnv<T>(
  fn: () => Promise<T>,
  providers?: IntegrationProviderId[]
): Promise<T> {
  const snapshot: Record<string, string | undefined> = {};
  const ids = providers ?? (["ga4", "gemini", "google_ads", "search_console", "bigquery", "merchant"] as IntegrationProviderId[]);

  for (const id of ids) {
    const payload = await getIntegrationPayload(id);
    if (!payload) continue;
    const def = getProviderDef(id);
    for (const key of def.envKeys) {
      const val = payload[key]?.trim();
      if (!val) continue;
      if (!(key in snapshot)) snapshot[key] = process.env[key];
      process.env[key] = val;
    }
  }

  try {
    return await fn();
  } finally {
    for (const [key, prev] of Object.entries(snapshot)) {
      if (prev === undefined) delete process.env[key];
      else process.env[key] = prev;
    }
  }
}
