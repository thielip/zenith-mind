import type { CommandCenterModuleId } from "@/server/command-center/registry/types";

/** 輕量 manifest（不含 load-seo / GA4 / GSC 依賴） */
export const seoModuleMeta = {
  id: "seo" satisfies CommandCenterModuleId,
  title: "SEO Intelligence",
  route: "/admin/dashboard/seo",
  revalidate: 60,
} as const;
