import { IntegrationsHubView } from "@/features/integrations-hub/components/integrations-hub-view";
import { loadIntegrationsHubPayload } from "@/server/command-center/load-integrations";

export const revalidate = 60;

export default async function IntegrationsPage() {
  const data = await loadIntegrationsHubPayload();
  return (
    <IntegrationsHubView rows={data.rows} initialValues={data.initialValues} />
  );
}
