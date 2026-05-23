import dynamic from "next/dynamic";
import type { SiteSettingsData } from "@/lib/site/types";

const SocialSidebar = dynamic(() => import("@/components/layout/SocialSidebar"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  settings: SiteSettingsData;
  locale: string;
}

export default function DeferredSocialSidebar(props: Props) {
  return <SocialSidebar {...props} />;
}
