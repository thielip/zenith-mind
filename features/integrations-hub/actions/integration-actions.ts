"use server";

import { revalidatePath, revalidateTag } from "next/cache";

function revalidateCommandCenterCache() {
  revalidateTag("cc-integrations");
  revalidateTag("cc-ga4");
  revalidateTag("cc-health");
  revalidateTag("cc-insights");
}
import { z } from "zod";
import {
  getProviderDef,
  integrationProviderIdSchema,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import {
  markIntegrationStatus,
  mergeIntegrationFormValues,
  saveIntegrationDraft,
} from "@/services/integrations/repository";
import { probeIntegrationProvider } from "@/services/integrations/probe-provider";
import { withIntegrationValues } from "@/services/integrations/runtime-env";

const valuesSchema = z.record(z.string(), z.string());

function secretFieldKeys(provider: IntegrationProviderId) {
  return getProviderDef(provider).fields.filter((f) => f.secret).map((f) => f.key);
}

export async function saveIntegrationAction(
  providerRaw: string,
  valuesRaw: Record<string, string>
) {
  const provider = integrationProviderIdSchema.parse(providerRaw);
  const values = await mergeIntegrationFormValues(
    provider,
    valuesSchema.parse(valuesRaw),
    secretFieldKeys(provider)
  );
  await saveIntegrationDraft(provider, values);
  revalidateCommandCenterCache();
  revalidatePath("/admin/dashboard/integrations", "page");
  revalidatePath("/admin/dashboard", "page");
  return { ok: true as const, message: "已儲存草稿（尚未啟動）" };
}

export async function activateIntegrationAction(
  providerRaw: string,
  valuesRaw: Record<string, string>
) {
  const provider = integrationProviderIdSchema.parse(providerRaw);
  const def = getProviderDef(provider);
  const values = await mergeIntegrationFormValues(
    provider,
    valuesSchema.parse(valuesRaw),
    secretFieldKeys(provider)
  );

  await saveIntegrationDraft(provider, values);

  const probe = await withIntegrationValues(values, def.envKeys, () =>
    probeIntegrationProvider(provider)
  );

  if (probe.ok) {
    await markIntegrationStatus(provider, "CONNECTED");
    revalidateCommandCenterCache();
    revalidatePath("/admin/dashboard/integrations", "page");
    revalidatePath("/admin/dashboard", "page");
    return { ok: true as const, message: probe.message };
  }

  await markIntegrationStatus(provider, "ERROR", probe.message);
  revalidatePath("/admin/dashboard/integrations", "page");
  return { ok: false as const, message: probe.message };
}

export async function disconnectIntegrationAction(providerRaw: string) {
  const provider = integrationProviderIdSchema.parse(providerRaw) as IntegrationProviderId;
  await markIntegrationStatus(provider, "DISCONNECTED");
  revalidateCommandCenterCache();
  revalidatePath("/admin/dashboard/integrations", "page");
  revalidatePath("/admin/dashboard", "page");
  return { ok: true as const, message: "已停用" };
}
