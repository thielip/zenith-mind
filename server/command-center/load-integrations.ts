import {
  INTEGRATION_PROVIDERS,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import {
  listIntegrationCredentials,
  listIntegrationFormValues,
} from "@/services/integrations/repository";

function envFallback(): Partial<Record<IntegrationProviderId, Record<string, string>>> {
  const out: Partial<Record<IntegrationProviderId, Record<string, string>>> = {};
  for (const def of INTEGRATION_PROVIDERS) {
    const values: Record<string, string> = {};
    for (const key of def.envKeys) {
      const v = process.env[key]?.trim();
      if (v) values[key] = v;
    }
    if (Object.keys(values).length > 0) out[def.id] = values;
  }
  return out;
}

export async function loadIntegrationsHubPayload() {
  const [rows, saved] = await Promise.all([
    listIntegrationCredentials(),
    listIntegrationFormValues(),
  ]);

  const initialValues = envFallback();
  for (const def of INTEGRATION_PROVIDERS) {
    const fromDb = saved[def.id];
    if (fromDb) {
      initialValues[def.id] = { ...initialValues[def.id], ...fromDb };
    }
  }

  return { rows, initialValues };
}
