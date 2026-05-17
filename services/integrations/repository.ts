import { prisma } from "@/infrastructure/db/prisma";
import { decryptSecret, encryptSecret } from "@/lib/integrations/crypto";
import { isMissingTableError } from "@/lib/db/prisma-errors";
import type { IntegrationProviderId } from "@/lib/integrations/providers";
import { z } from "zod";

const payloadSchema = z.record(z.string(), z.string());

function parsePayload(encrypted: string): Record<string, string> | null {
  try {
    return payloadSchema.parse(JSON.parse(decryptSecret(encrypted)));
  } catch {
    return null;
  }
}

export async function listIntegrationCredentials() {
  try {
    return await prisma.integrationCredential.findMany({
      orderBy: { provider: "asc" },
      select: {
        provider: true,
        status: true,
        lastError: true,
        lastVerifiedAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function getIntegrationPayload(
  provider: IntegrationProviderId
): Promise<Record<string, string> | null> {
  try {
    const row = await prisma.integrationCredential.findUnique({
      where: { provider },
    });
    if (!row || row.status !== "CONNECTED") return null;
    return parsePayload(row.payloadEncrypted);
  } catch (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
}

export async function listIntegrationFormValues(): Promise<
  Partial<Record<IntegrationProviderId, Record<string, string>>>
> {
  try {
    const rows = await prisma.integrationCredential.findMany();
    const out: Partial<Record<IntegrationProviderId, Record<string, string>>> = {};
    for (const row of rows) {
      const values = parsePayload(row.payloadEncrypted);
      if (values) out[row.provider as IntegrationProviderId] = values;
    }
    return out;
  } catch (error) {
    if (isMissingTableError(error)) return {};
    throw error;
  }
}

export async function saveIntegrationDraft(
  provider: IntegrationProviderId,
  values: Record<string, string>
) {
  const encrypted = encryptSecret(JSON.stringify(values));
  try {
    await prisma.integrationCredential.upsert({
      where: { provider },
      create: {
        provider,
        payloadEncrypted: encrypted,
        status: "DISCONNECTED",
      },
      update: {
        payloadEncrypted: encrypted,
        status: "DISCONNECTED",
        lastError: null,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      throw new Error(
        "integration_credentials 資料表尚未建立，請執行：npm run db:deploy:local"
      );
    }
    throw error;
  }
}

export async function markIntegrationStatus(
  provider: IntegrationProviderId,
  status: "CONNECTED" | "ERROR" | "DISCONNECTED",
  lastError?: string
) {
  try {
    await prisma.integrationCredential.update({
      where: { provider },
      data: {
        status,
        lastError: lastError ?? null,
        lastVerifiedAt: status === "CONNECTED" ? new Date() : undefined,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      throw new Error(
        "integration_credentials 資料表尚未建立，請執行：npm run db:deploy:local"
      );
    }
    throw error;
  }
}
