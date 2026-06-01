import { loadSeoPayload } from "@/server/command-center/load-seo";
import type { CommandCenterModule } from "@/server/command-center/registry/types";
import {
  seoPayloadSchema,
  type SeoPayload,
} from "@/types/command-center/module-payloads";

export const seoCommandCenterModule: CommandCenterModule<
  typeof seoPayloadSchema
> = {
  id: "seo",
  title: "SEO Intelligence",
  route: "/admin/dashboard/seo",
  revalidate: 60,
  schema: seoPayloadSchema,
  load: loadSeoPayload,
};

export type { SeoPayload };
