import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const base = defineCloudflareConfig({});

export default {
  ...base,
  // 勿用預設 npm run build，確保 CF_PUBLIC_ONLY 在 next build 前已設定
  buildCommand: "npm run build:next:public",
};
