# Performance P1–P3 Changelog

## P1 — Chunk / third-party whitelist (low risk)

- Deferred analytics mount via `PublicAnalyticsMount` (client-only dynamic import).
- Clarity loads only after consent, via `requestIdleCallback` / delayed timeout.
- Removed admin-only `.command-center` global CSS; scoped to `app/admin/dashboard/command-center.css`.
- Documented forbidden public imports in `lib/build/public-bundle-guard.ts`.
- Added `scripts/perf/public-bundle-audit.mjs` for post-build chunk inspection.
- Extended `optimizePackageImports` to avoid pulling recharts/framer-motion/react-query into CF public builds.

## P2 — Compiler baseline (medium risk, needs regression)

- Added `.browserslistrc` targeting Chrome/Firefox/Safari/Edge >= 120 (single source; do not duplicate in `package.json`).

## P3 — Self-test checklist

- `npm run build`
- `npm test` (login-form, client-session)
- `node scripts/perf/public-bundle-audit.mjs` (after build)
- Manual: `/admin/login`, `/zh-TW`, `/zh-TW/blog` — no Application error
- PageSpeed on `getzenithmind.com` (user to run externally)

## Deploy note

After user approval: commit + push to `main`, then verify Vercel production.
