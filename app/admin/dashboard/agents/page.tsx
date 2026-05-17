import { loadAgentPayload } from "@/server/command-center/load-agents";
import { AgentsPageView } from "@/features/agent-center/components/agents-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadAgentPayload();
  return <AgentsPageView data={data} />;
}
