import { loadSecurityPayload } from "@/server/command-center/load-security";
import { SecurityPageView } from "@/features/security-center/components/security-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadSecurityPayload();
  return <SecurityPageView data={data} />;
}
