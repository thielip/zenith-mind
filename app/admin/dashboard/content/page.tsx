import { loadContentPayload } from "@/server/command-center/load-content";
import { ContentPageView } from "@/features/content-intelligence/components/content-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadContentPayload();
  return <ContentPageView data={data} />;
}
