import { loadErrorsPayload } from "@/server/command-center/load-errors";
import { ErrorsPageView } from "@/features/error-intelligence/components/errors-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadErrorsPayload();
  return <ErrorsPageView data={data} />;
}
