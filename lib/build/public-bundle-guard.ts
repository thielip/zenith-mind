/**
 * Public-site bundle guardrails (P1).
 * Documents which modules must not be pulled into Cloudflare public worker bundles.
 */
export const PUBLIC_FORBIDDEN_SERVER_IMPORTS = [
  "@/server/command-center",
  "@/features/war-room",
  "@/features/seo-intelligence",
  "@/features/geo-intelligence",
  "@/features/aeo-intelligence",
  "@/widgets/chart-panel",
  "@/widgets/command-center",
  "@/infrastructure/ga4/reporting.client",
] as const;
