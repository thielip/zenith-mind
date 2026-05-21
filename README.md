# Zenith Mind

Marketing site and operations command center for [getzenithmind.com](https://www.getzenithmind.com). The public experience is localized (next-intl), SEO-focused, and analytics-aware; the admin dashboard covers content, traffic, SEO/AEO/GEO intelligence, AI agents, forecasting, and security monitoring.

## Architecture

This repo is a single Next.js 15 application with a **split deployment** model:

| Layer | Platform | URL (production) | What runs there |
|-------|----------|------------------|-----------------|
| **Public site** | Cloudflare Workers (OpenNext) | `https://www.getzenithmind.com` | Locale pages, blog, public APIs, edge middleware |
| **Admin & server APIs** | Vercel | `https://zenith-mind.vercel.app` | `/admin/*`, auth, cron, AI queue, integrations |
| **Database** | Supabase PostgreSQL | — | Prisma ORM (`DATABASE_URL` + `DIRECT_URL`) |
| **Cache / queues** | Upstash Redis | — | JWT denylist, AI job queue |
| **Media** | Supabase Storage | — | Uploads; public images via Supabase render on CF |

On Cloudflare, middleware redirects `/admin` and admin API routes to `ADMIN_DEPLOYMENT_URL` (Vercel). The CF build (`npm run build:cf`) temporarily stashes admin directories and hides local `.env*` files so secrets are not bundled into the Worker.

```
Browser → www.getzenithmind.com (CF Worker)
              ├─ /zh-TW, /blog, …        → public RSC/pages
              ├─ /api/public/*           → page views, webhooks (public)
              └─ /admin, /api/admin/*    → 302 → Vercel admin deployment
```

## Tech stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, Radix UI, Framer Motion
- **i18n:** next-intl (`zh-TW`, locale-prefixed routes)
- **Data:** Prisma 6 + PostgreSQL (Neon/serverless adapter on Workers)
- **Auth:** JWT (access/refresh), TOTP 2FA, bcrypt
- **AI:** Google Gemini (admin), optional OpenAI-compatible paths
- **Analytics:** GA4, GTM, consent-gated client events, on-site `page_views`
- **Integrations:** Google Search Console, GA4 Reporting API, BigQuery (optional), Supabase REST
- **Edge CF:** `@opennextjs/cloudflare`, Wrangler 4

## Repository layout

```
app/
  (public)/[locale]/     # Marketing pages (home, blog, about)
  admin/                 # CMS + command center dashboard
  api/                   # Route handlers (public + admin + cron)
components/              # Shared UI (layout, home, analytics, admin)
features/                # Dashboard modules (war-room, agents, SEO, GEO, …)
lib/                     # DB, auth, middleware, analytics, images, SEO
prisma/                  # Schema and migrations
scripts/                 # Build, env checks, secret scan, ops helpers
docs/                    # Deployment and integration runbooks
env.ts                   # t3-env validated environment variables
middleware.ts            # Locale, redirects, auth, security headers
wrangler.toml            # Cloudflare Worker config (non-secret vars only)
```

## Getting started

### Prerequisites

- Node.js 22+
- PostgreSQL connection strings (Supabase)
- Upstash Redis, Supabase project, and other values listed in `.env.example`

### Install and run locally

```bash
git clone https://github.com/thielip/zenith-mind.git
cd zenith-mind
npm install

cp .env.example .env.local
# Fill in all required variables (see env.ts)

npm run db:generate:local   # Prisma client
npm run db:deploy:local     # Apply migrations (when DB is ready)
npm run dev                 # http://localhost:3000
```

Create an admin user (after DB is up):

```bash
npm run admin:ensure
```

### Environment variables

- **Local / Vercel:** copy [`.env.example`](.env.example) → `.env.local`. All server and client vars are validated in [`env.ts`](env.ts) at build time.
- **Cloudflare Worker:** non-sensitive vars in [`wrangler.toml`](wrangler.toml); secrets via `npx wrangler secret put <NAME>`. Local CF preview: [`.dev.vars.example`](.dev.vars.example) → `.dev.vars` (gitignored).

Never commit `.env`, `.env.local`, service account JSON, or private keys.

### Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Full app build (Vercel / local admin) |
| `npm run build:cf` | Public-only CF bundle via `scripts/cf-public-build.mjs` |
| `npm run lint` / `npm run type-check` | Quality gates |
| `npm test` | Jest unit tests |
| `node scripts/check-env-keys.mjs` | Verify required keys exist (not values) |
| `node scripts/scan-secrets.mjs` | Scan tracked files for accidental secrets |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:deploy` | Prisma migrate deploy (CI/production) |

## Deployment

### Admin (Vercel)

Push to `main` or deploy from the Vercel dashboard. Ensure Production env vars match `.env.example` and run:

```bash
npm run build
```

### Public site (Cloudflare)

See **[docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md)** for the full checklist. Short version:

```bash
npm run build:cf
npx wrangler deploy
```

Vercel-only changes do **not** update the public Worker; redeploy CF when public routes, middleware, or client bundles change.

### Integrations (GSC, GA4, BigQuery, …)

Operational setup for the command center is documented in **[docs/COMMAND-CENTER-INTEGRATIONS.md](docs/COMMAND-CENTER-INTEGRATIONS.md)**.

## Admin command center (overview)

Routes under `/admin/dashboard/` include:

- **War room** — KPIs and operational alerts
- **Traffic / Realtime** — GA4 and live signals
- **SEO / AEO / GEO** — Search visibility and content readiness
- **Content** — Editorial intelligence
- **Agents** — AI job queue and automation
- **Forecast** — Trend projections
- **Integrations** — Third-party health and probes
- **Security / Errors** — Headers, env check, error intelligence

CMS routes: posts, affiliate links, audit log, TOTP setup.

## Security

- Environment validation via `@t3-oss/env-nextjs`; no secrets in `NEXT_PUBLIC_*`
- Baseline security headers and CSP nonces in [`middleware.ts`](middleware.ts)
- CF public build strips admin trees and asserts the bundle has no admin-only secrets
- Run `node scripts/scan-secrets.mjs` before releases
- Rotate any credential that was ever pasted into chat, logs, or an accidental commit

## License

Private repository — all rights reserved unless otherwise noted by the owner.
