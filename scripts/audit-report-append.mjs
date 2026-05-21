import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const base = fs.readFileSync(path.join(root, "docs/CODEBASE-AUDIT-REPORT.md"), "utf8");

const append = `

---

## 3. API 完整清單（逐條，不可合併）

### \`app/api/health/public-data/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| runtime | dynamic = force-dynamic |
| Auth | 無 |
| 輸入 | 無 body |
| 處理 | 呼叫 \`probePublicPostsHealth()\`、\`isPublicDataDegraded()\` |
| 輸出 200 | \`{ status: "ok", health }\` |
| 輸出 503 | \`{ status: "degraded", health }\` + Cache-Control no-store + Retry-After 300 |

### \`app/api/public/page-view/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | POST |
| runtime | nodejs |
| Auth | 無 |
| 輸入 JSON | \`{ postId?: string, locale: "zh-TW"|"en", referer?: string }\`（Zod 於 record-page-view-core） |
| 處理 | \`recordPageViewCore(body, headers)\`；prod 需 \`PAGEVIEW_HASH_SALT\` |
| 輸出 200 | \`{ ok: true }\` |
| 輸出 400 | validation / invalid_json |
| 輸出 503 | missing_salt |
| 輸出 502 | supabase_insert / prisma 失敗 |

### \`app/api/search/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | 無 |
| Query | \`q\`（≥2 字）、\`locale\`（zh-TW|en） |
| 處理 | Prisma \`post.findMany\` status=PUBLISHED, ILIKE title/excerpt |
| 輸出 | \`{ query, locale, items: PublicPostListItemDto[] }\` take 30 |

### \`app/api/redirect/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | Header \`x-redirect-internal\` === \`REDIRECT_LOOKUP_SECRET\`；非 production 可 dev-redirect |
| Query | \`path\` 必須以 / 開頭 |
| 處理 | \`normalizeRedirectPathname\` → \`findActiveRedirect\` |
| 輸出 | \`{ hit: false }\` 或 \`{ hit: true, newPath, statusCode }\` |

### \`app/api/revalidate/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | POST |
| Auth | Bearer timing-safe 比對 \`REVALIDATE_SECRET\` 或 \`WEBHOOK_SECRET\` |
| Body | \`{ type?, value? }\` 或 \`{ items: [{ type: "path"|"tag", value }] }\` |
| 處理 | \`assertRevalidateTarget\` → \`revalidatePath\` / \`revalidateTag\` |
| 輸出 | \`{ success: true, revalidated: string[] }\` |

### \`app/api/webhook/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | POST |
| Auth | x-webhook-signature HMAC-SHA256(timestamp.body)；timestamp ±5min；nonce Redis NX |
| Body | JSON \`{ event?, data? }\` |
| 事件 | POST_PUBLISHED / AI_JOB_DONE → prisma.eventOutbox.create |
| 輸出 | \`{ success: true }\` 或 401/500 |

### \`app/api/auth/refresh/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | POST |
| Auth | Cookie \`refresh_token\` |
| 處理 | \`refreshTokens\`；輪替 access+refresh cookie |
| 輸出 | \`{ success: true }\` 或 401 SESSION_EXPIRED |

### \`app/api/auth/ping/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | Cookie \`access_token\` |
| 輸出 | \`{ authenticated: true, remainingSeconds }\` 或 401 |

### \`app/api/admin/env-check/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | \`gateAdminRead()\` |
| 輸出 | keys 存在性（REVALIDATE_SECRET, REDIRECT_LOOKUP_SECRET, BIGQUERY_DATASET_ID, GOOGLE_CLOUD_PROJECT_ID）、bigquery 區塊、hints；Cache-Control no-store |

### \`app/api/admin/integrations/probe/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | POST |
| Auth | \`gateAdminRead()\` |
| Body | \`{ id: string }\` — postgres|redis|supabase-admin|gemini|ga4-reporting|google-ads-oauth|search-console-live |
| 輸出 | \`{ id, ok, message, checkedAt }\` |

### \`app/api/admin/integrations/refresh-health/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | POST |
| Auth | \`gateAdminRead()\` |
| 處理 | revalidateTag cc-health, cc-integrations；\`runIntegrationHealthChecks()\` |
| 輸出 | checkedAt, summary, focused items |

### \`app/api/admin/audit-log/export/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | \`gateAdminRead()\` |
| Query | audit log list params（parseAuditLogListParams） |
| 輸出 | CSV attachment UTF-8 BOM |

### \`app/api/admin/realtime/stream/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | **檔案內無 JWT 驗證** |
| 輸出 | SSE text/event-stream；每 2s 推送 \`getRealtimeBuffer()\` 新事件 |

### \`app/api/ai/jobs/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | POST |
| Auth | access_token cookie + verifyAccessToken |
| Body | CreateAiJobSchema（type, postId, idempotencyKey, options） |
| 輸出 201 | \`{ success, jobId }\`；P2002 冪等回傳既有 job |

### \`app/api/ai/jobs/[id]/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | access JWT + userId 範圍 |
| 輸出 | job status, stepIndex, result, failedReason… |

### \`app/api/ai/worker/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | Authorization Bearer \`CRON_SECRET\` |
| 處理 | claimNextJob → GENERATE_DRAFT orchestrator |
| maxDuration | 60 |

### \`app/api/cron/cleanup/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | Bearer CRON_SECRET |
| 處理 | cleanupPageViews(180d), cleanupAuditLogs(90d), EventOutbox 50 筆 |

### \`app/api/cron/aggregate-views/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | Bearer CRON_SECRET |
| 處理 | SQL \`refresh_page_view_daily_aggregates()\`；revalidateTag page-view-stats, homepage-stats |

### \`app/api/cron/publish-scheduled/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | Bearer CRON_SECRET |
| 處理 | SCHEDULED + scheduledAt<=now → PUBLISHED；revalidate + purgePublicSiteAfterPostChange |

### \`app/(public)/go/[slug]/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| Auth | 無 |
| 處理 | affiliateLink.findUnique → recordAffiliateClick → 301 targetUrl |

### \`app/google0276434467af2dd0.html/route.ts\`

| 項目 | 內容 |
|------|------|
| HTTP | GET |
| 輸出 | 固定字串 google-site-verification（force-static） |

---

## 4. Database Schema（逐 model、逐欄位）

來源檔：\`prisma/schema.prisma\`

### model User → 表 users

| 欄位 | Prisma 型別 | DB | Nullable | Default | 約束 |
|------|-------------|-----|----------|---------|------|
| id | String | text | N | cuid() | PK |
| email | String | text | N | — | UNIQUE |
| password | String | text | N | — | bcrypt |
| totpSecret | String? | text | Y | — | |
| totpEnabled | Boolean | bool | N | false | |
| totpVerifiedAt | DateTime? | timestamp | Y | — | |
| role | UserRole | enum | N | ADMIN | |
| deletedAt | DateTime? | timestamp | Y | — | |
| createdAt | DateTime | timestamp | N | now() | |
| updatedAt | DateTime | timestamp | N | @updatedAt | |
| posts | Post[] | — | — | — | 1:N |
| auditLogs | AuditLog[] | — | — | — | 1:N |
| aiJobs | AiJob[] | — | — | — | 1:N |
| @@index | [email], [email, deletedAt], [deletedAt] | | | | |

### model Category → categories

| 欄位 | 型別 | Nullable | Default | 約束 |
|------|------|----------|---------|------|
| id | String | N | cuid() | PK |
| slug | String | N | — | UNIQUE |
| name | String | N | — | |
| nameEn | String? | Y | — | |
| description | String? | Y | — | |
| color | String? | Y | — | |
| deletedAt | DateTime? | Y | — | |
| createdAt | DateTime | N | now() | |
| updatedAt | DateTime | N | — | |
| posts | Post[] | — | — | 1:N |
| @@index | [slug] | | | |

### model Tag → tags

| 欄位 | 型別 | Nullable | Default | 約束 |
|------|------|----------|---------|------|
| id | String | N | cuid() | PK |
| slug | String | N | — | UNIQUE |
| name | String | N | — | |
| nameEn | String? | Y | — | |
| deletedAt | DateTime? | Y | — | |
| createdAt/updatedAt | DateTime | N | — | |
| posts | PostTag[] | — | — | N:M |
| @@index | [slug] | | | |

### model Post → posts

| 欄位 | 型別 | Nullable | Default | 說明 |
|------|------|----------|---------|------|
| id | String | N | cuid() | PK |
| slug | String | N | — | UNIQUE |
| status | PostStatus | N | DRAFT | |
| title | String | N | — | |
| titleEn | String? | Y | — | |
| excerpt / excerptEn | String? | Y | — | |
| content | String @db.Text | N | — | |
| contentEn | String? @db.Text | Y | — | |
| contentType | String | N | "markdown" | |
| coverImage | String? | Y | — | |
| coverImageAlt | String? | Y | — | |
| coverImageWidth | Int? | Y | — | |
| coverImageHeight | Int? | Y | — | |
| coverImageBlurHash | String? | Y | — | |
| contentBlocks | Json? | Y | — | |
| contentDoc | Json? | Y | — | |
| faq | Json? | Y | — | |
| faqVersion | Int | N | 1 | |
| faqUpdatedAt | DateTime? | Y | — | |
| publishedAt | DateTime? | Y | — | |
| scheduledAt | DateTime? | Y | — | |
| isPasswordProtected | Boolean | N | false | |
| accessPasswordHash | String? | Y | — | |
| isProgrammatic | Boolean | N | false | |
| pSeoTemplate | String? | Y | — | |
| readingTime | Int | N | 0 | |
| deletedAt | DateTime? | Y | — | soft delete |
| createdAt/updatedAt | DateTime | N | — | |
| authorId | String | N | — | FK User |
| categoryId | String? | Y | — | FK Category |
| tags | PostTag[] | — | — | |
| seoMetadata | SeoMetadata? | — | — | 1:1 |
| pageViews | PageView[] | — | — | |
| dailyAggregates | DailyAggregate[] | — | — | |
| aiJobs | AiJob[] | — | — | |
| @@index | slug, status+publishedAt, status+deletedAt+publishedAt, deletedAt+coverImage, createdAt, categoryId, deletedAt, scheduledAt+status, isProgrammatic | | | |

### model AdSlot → ad_slots

| 欄位 | 型別 | Nullable | Default | 約束 |
|------|------|----------|---------|------|
| id | String | N | cuid() | PK |
| slotKey | String | N | — | @@unique(slotKey, locale) |
| locale | String | N | "zh-TW" | |
| name | String | N | — | |
| imageUrl | String | N | — | |
| imageWidth/Height | Int? | Y | — | |
| imageAlt | String | N | — | |
| blurHash | String? | Y | — | |
| href | String? | Y | — | |
| aspectRatio | String? | Y | — | |
| priority | Int | N | 0 | |
| isActive | Boolean | N | true | |
| createdAt/updatedAt | DateTime | N | — | |

### model PostTag → post_tags

| 欄位 | 型別 | 約束 |
|------|------|------|
| postId | String | PK composite, FK Post CASCADE |
| tagId | String | PK composite, FK Tag CASCADE |
| @@index | [tagId] |

### model SeoMetadata → seo_metadata

| 欄位 | 型別 | Nullable | Default |
|------|------|----------|---------|
| id | String | N | cuid() |
| metaTitle/En | String? | Y | — |
| metaDescription/En | String? | Y | — |
| canonicalUrl | String? | Y | — |
| ogTitle/Description/Image | String? | Y | — |
| focusKeyword/En | String? | Y | — |
| keywords | String[] | N | — |
| noIndex/noFollow | Boolean | N | false |
| version | Int | N | 1 |
| isActive | Boolean | N | true |
| postId | String | N | UNIQUE FK Post CASCADE |

### model Redirect → redirects

| 欄位 | 型別 | Default | 約束 |
|------|------|---------|------|
| id | String | cuid() | PK |
| oldPath | String | — | UNIQUE |
| newPath | String | — | |
| statusCode | Int | 301 | |
| isActive | Boolean | true | |
| createdAt | DateTime | now() | |
| @@index | [oldPath, isActive] |

### model PageView → page_views

| 欄位 | 型別 | Nullable | Default |
|------|------|----------|---------|
| id | String | N | cuid() |
| visitorHash | String? | Y | — |
| referer | String? | Y | — |
| locale | String | N | "zh-TW" |
| createdAt | DateTime | N | now() |
| postId | String? | Y | FK Post SetNull |
| @@index | [createdAt], [postId, createdAt] |

### model DailyAggregate → daily_aggregates

| 欄位 | 型別 | Default | 約束 |
|------|------|---------|------|
| id | String | cuid() | PK |
| date | DateTime | — | |
| views | Int | 0 | |
| uniqueVisitors | Int | 0 | |
| postId | String | — | FK Post CASCADE |
| @@unique | [date, postId] | | |
| @@index | [postId, date DESC] |

### model SiteDailyAggregate → site_daily_aggregates

| 欄位 | 型別 | Default | 約束 |
|------|------|---------|------|
| id | String | cuid() | PK |
| date | DateTime @db.Date | — | |
| locale | String | "zh-TW" | |
| views | Int | 0 | |
| uniqueVisitors | Int | 0 | |
| @@unique | [date, locale] | | |

### model AffiliateLink → affiliate_links

| 欄位 | 型別 | Default | 約束 |
|------|------|---------|------|
| id | String | cuid() | PK |
| name | String | — | |
| slug | String | — | UNIQUE |
| targetUrl | String | — | |
| platform | String? | — | |
| commission | String? | — | |
| isActive | Boolean | true | |
| clickCount | Int | 0 | |
| dailyClicks | AffiliateLinkClickDaily[] | — | |

### model AffiliateLinkClickDaily → affiliate_link_click_daily

| 欄位 | 型別 | 約束 |
|------|------|------|
| affiliateLinkId | String | PK composite |
| date | DateTime @db.Date | PK composite |
| clickCount | Int | default 0 |
| FK | AffiliateLink CASCADE | |

### model AiJob → ai_jobs

| 欄位 | 型別 | Default | 說明 |
|------|------|---------|------|
| id | String | cuid() | PK |
| idempotencyKey | String | — | UNIQUE |
| type | AiJobType | — | |
| status | AiJobStatus | PENDING | |
| payload/result/failedReason | Json | — | |
| retryCount | Int | 0 | max 3 |
| lockedAt/lockedBy/startedAt/timeoutAt/scheduledAt | DateTime? | — | SLA |
| stepIndex | Int | 0 | checkpoint |
| partialResult | Json? | — | |
| postId/userId | String? | — | FK optional |
| 多組 @@index | status+createdAt 等 | | |

### model AuditLog → audit_logs

| 欄位 | 型別 | Nullable |
|------|------|----------|
| id | String | N |
| action | AuditAction | N |
| entityType/entityId | String? | Y |
| metadata | Json? | Y |
| ipMasked | String? | Y |
| userAgent | String? | Y |
| requestId | String? | Y |
| createdAt | DateTime | N |
| userId | String? | Y FK User SetNull |

### model EventOutbox → event_outbox

| 欄位 | 型別 | Default |
|------|------|---------|
| id | String | cuid() |
| eventType | String | — |
| payload | Json | — |
| status | OutboxStatus | PENDING |
| error | String? | — |
| processedAt | DateTime? | — |
| createdAt | DateTime | now() |

### model NewsletterSubscriber → newsletter_subscribers

| 欄位 | 型別 | Default | 約束 |
|------|------|---------|------|
| id | String | cuid() | PK |
| email | String | — | UNIQUE |
| locale | String | "zh-TW" | |
| source | String | "homepage" | |
| status | NewsletterSubscriberStatus | ACTIVE | |

### model SiteSettings → site_settings

| 欄位 | 型別 | Default | 說明 |
|------|------|---------|------|
| id | String | "site" | 單例 PK |
| logoUrl/logoAlt | String? | — | |
| quickLinks/socialLinks/homepageCopy/aboutSections | Json? | — | |
| instagramEmbedUrl | String? | — | |
| socialSidebarActive | Boolean | false | |
| heroAutoplaySeconds | Int | 8 | |
| carouselAutoplaySeconds | Int | 6 | |

### model HeroSlide → hero_slides

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | String | PK |
| locale | String | default zh-TW |
| title | String | |
| subtitle/buttonLabel/buttonHref/imageHref | String? | |
| imageUrl/imageAlt | String | |
| textX/textY | Int | default 12, 50 |
| sortOrder | Int | 0 |
| isActive | Boolean | true |

### model HomeCarouselItem → home_carousel_items

結構類似 HeroSlide（locale, title, description, href, imageUrl, imageAlt, sortOrder, isActive）

### model IntegrationCredential → integration_credentials

| 欄位 | 型別 | 約束 |
|------|------|------|
| id | String | PK |
| provider | String | UNIQUE |
| payloadEncrypted | String @db.Text | |
| status | IntegrationConnectionStatus | DISCONNECTED |
| lastError | String? | |
| lastVerifiedAt | DateTime? | |

---

## 5. Auth / Middleware 真實流程圖

### 5.1 middleware.ts 逐步（檔案：\`middleware.ts\`）

\`\`\`mermaid
flowchart TD
  A[NextRequest] --> B{canonicalHostRedirect}
  B -->|301| R[Redirect Response]
  B -->|null| C{shouldProxyAdminToExternal}
  C -->|302 Vercel| R
  C -->|no| D{pathname === /}
  D -->|302 /zh-TW| R
  D -->|no| E[redirectGuard DB 301]
  E -->|hit| R
  E -->|no| F{prod AND NOT VERCEL AND NOT CF IP}
  F -->|403| R403[403]
  F -->|no| G{proxy admin?}
  G -->|no| H[adminAuthGuard]
  H -->|redirect login| R
  H -->|null| I[generateNonce x-nonce]
  I --> J[injectSecurityHeaders CSP]
  J --> K[NextResponse.next]
\`\`\`

### 5.2 登入 Token（檔案：\`domain/auth/auth.service.ts\`、\`actions/auth.actions.ts\`、\`lib/auth/jwt.ts\`）

\`\`\`mermaid
sequenceDiagram
  participant U as User
  participant A as auth.actions loginAction
  participant S as auth.service
  participant J as jwt.ts
  participant C as Cookies

  U->>A: email password
  A->>S: loginWithEmail
  alt totpEnabled
    S->>J: signTempToken
    S->>C: temp_token 5min
  else
    S->>J: signAccessToken signRefreshToken
    S->>C: access_token 1h refresh_token 7d
  end
  U->>A: verifyTotpAction
  A->>S: verifyTotpAndIssue
  S->>C: access refresh
\`\`\`

### 5.3 adminAuthGuard PROTECTED 前綴（檔案：\`lib/middleware/auth-guard.ts\` 第 9-18 行）

- /admin/dashboard
- /admin/site
- /admin/posts
- /admin/media
- /admin/affiliate
- /admin/analytics
- /admin/audit-log
- /admin/settings

**未包含**：/admin/users（由 \`app/admin/users/page.tsx\` 頁內處理）

---

# 第二部分：工程級架構分析（FILE SCAN 完成後）

## 6. 系統架構圖（Mermaid）

\`\`\`mermaid
flowchart TB
  subgraph Client
    BR[Browser]
  end
  subgraph Cloudflare
    CDN[CDN]
    W[Worker OpenNext]
    MW[middleware.ts]
  end
  subgraph Vercel
    VA[Next.js Admin Full]
    CRON[Vercel Cron]
  end
  subgraph Data
    PG[(Supabase PostgreSQL)]
    RD[(Upstash Redis)]
    ST[Supabase Storage]
  end
  BR --> CDN --> W --> MW
  MW -->|admin paths| VA
  W --> PG
  W --> ST
  VA --> PG
  VA --> RD
  CRON --> VA
\`\`\`

## 7. 資料流分析（Request → DB）

### 7.1 公開文章詳情 GET /zh-TW/blog/[slug]

1. \`app/(public)/[locale]/blog/[slug]/page.tsx\` — revalidate 3600
2. \`lib/blog/load-blog-post-data.ts\` 或 supabase 變體
3. 讀取 \`posts\` + \`seo_metadata\` + tags（Supabase REST 或 Prisma）
4. RSC 渲染 \`components/blog/PostArticleBody.tsx\`
5. Client \`PageViewTracker\` → POST \`/api/public/page-view\`
6. \`record-page-view-core.ts\` → CF: supabaseInsert page_views；Vercel: prisma.pageView.create

### 7.2 後台建立文章 POST Server Action

1. \`components/admin/Editor/NewPostForm.tsx\` → \`createPostAction\`
2. \`actions/post.create.actions.ts\` gateAdminWrite post
3. prisma.post.create + seoMetadata
4. revalidateTag posts + purgePublicSiteAfterPostChange

## 8. 安全性分析（逐點）

| # | 檔案 | 機制 |
|---|------|------|
| 1 | \`lib/middleware/security-headers.ts\` | CSP nonce strict-dynamic；生產關 unsafe-eval |
| 2 | \`lib/middleware/ip-guard.ts\` | CF Worker 非代理 403 |
| 3 | \`app/api/webhook/route.ts\` | HMAC + timestamp + Redis nonce |
| 4 | \`app/api/revalidate/route.ts\` | timingSafeEqual Bearer |
| 5 | \`lib/auth/password.ts\` | bcrypt 12 rounds |
| 6 | \`lib/auth/totp.ts\` | AES-256-CBC totpSecret |
| 7 | \`infrastructure/redis/token-blacklist.ts\` | refresh 輪替黑名單 |
| 8 | \`lib/sanitize/html.ts\` | 入庫消毒 |
| 9 | \`lib/security/revalidate-target.ts\` | 限制 revalidate 路徑 |
| 10 | \`app/api/admin/realtime/stream/route.ts\` | **缺口：無 auth** |

## 9. 效能分析（逐點）

| # | 檔案 | 行為 |
|---|------|------|
| 1 | 公開 layout/page revalidate=3600 | ISR 1h |
| 2 | \`lib/db/supabase-rest.ts\` | next.revalidate 3600 + tags |
| 3 | \`next.config.ts\` images minimumCacheTTL 31536000 | 圖快取 |
| 4 | \`lib/images/delivery.ts\` CF 用 supabase-render | 避開 /_next/image |
| 5 | features/* dynamic import recharts | 縮小首屏 JS |
| 6 | \`scripts/cf-public-build.mjs\` | 剔除 admin 縮 Worker |
| 7 | \`app/api/cron/aggregate-views\` | DB 端 refresh_page_view_daily_aggregates 批次 |

---

# 第三部分：維護 SOP（對應實際檔案）

## A. 新增 Post 欄位（例：\`seriesSlug\`；\`readingTime\` 已存在於 schema 第 199 行）

| 步驟 | 檔案路徑 |
|------|----------|
| 1 Schema | \`prisma/schema.prisma\` model Post 新增 \`seriesSlug String?\` |
| 2 Migration | \`npx prisma migrate dev --name add_post_series_slug\` → \`prisma/migrations/<timestamp>_*/migration.sql\` |
| 3 Client | \`npm run db:generate:local\` |
| 4 Zod + Action | \`actions/post.create.actions.ts\` createSchema；\`actions/post.actions.ts\` update schema |
| 5 後台表單 | \`components/admin/Editor/NewPostForm.tsx\`、\`components/admin/Editor/PostEditor.tsx\` |
| 6 公開 DTO | \`lib/dto/post-public.dto.ts\` |
| 7 公開 loader | \`lib/blog/public-blog-post-supabase.ts\`、\`lib/blog/load-blog-post-data-prisma.ts\` |
| 8 公開 UI | \`app/(public)/[locale]/blog/[slug]/page.tsx\`、\`components/blog/PostArticleBody.tsx\` |
| 9 Cache | \`actions/post.actions.ts\` 內 revalidateTag；\`lib/revalidate/purge-public-site.ts\` |

## B. 新增 API

| 項目 | 路徑規範 |
|------|----------|
| 公開 API | \`app/api/<namespace>/route.ts\` |
| 動態段 | \`app/api/<ns>/[id]/route.ts\` |
| Admin API | \`app/api/admin/<name>/route.ts\` + \`gateAdminRead()\` |
| Cron | \`app/api/cron/<name>/route.ts\` + Bearer CRON_SECRET |
| CF 部署 | 若路徑在 \`lib/deploy/admin-origin.ts\` ADMIN_PATH_PREFIXES 內，只會在 Vercel 執行 |

## C. 新增 Page Route

| 類型 | 路徑 |
|------|------|
| 公開多語 | \`app/(public)/[locale]/<segment>/page.tsx\` |
| 後台 | \`app/admin/<segment>/page.tsx\` 或 \`app/admin/dashboard/<segment>/page.tsx\` |
| Layout | 沿用 \`app/(public)/[locale]/layout.tsx\` 或 \`app/admin/layout.tsx\` |
| i18n | \`messages/zh-TW.json\`、\`messages/en.json\` |
| Middleware | 若需登入，將前綴加入 \`lib/middleware/auth-guard.ts\` PROTECTED 陣列 |

## D. Theme 修改

| 檔案 | 內容 |
|------|------|
| \`app/globals.css\` | :focus-visible、.command-center 變數、article 樣式 |
| \`postcss.config.mjs\` | Tailwind PostCSS 入口 |
| 無 \`tailwind.config.js\` | Tailwind v4 以 CSS @import 為準 |
| 元件內 className | \`components/**\`、\`features/**\`、\`widgets/**\` 硬編碼色需逐一替換 |
| \`shared/ui/button.tsx\` 等 | CVA 變體 |

---

# 第四部分：技術債（引用檔案）

### TD-001

| 項目 | 內容 |
|------|------|
| 檔案位置 | \`app/api/admin/realtime/stream/route.ts\` |
| 問題描述 | GET SSE 未呼叫 gateAdminRead 或 verifyAccessToken |
| 影響範圍 | 任何人可訂閱即時事件緩衝 |
| 修復方式 | 在 route 開頭加入 \`gateAdminRead()\` 或驗證 cookie；401 拒絕 |

### TD-002

| 檔案位置 | \`lib/middleware/auth-guard.ts\` PROTECTED 陣列 vs \`app/admin/users/page.tsx\` |
| 問題描述 | /admin/users 不在 middleware PROTECTED |
| 影響範圍 | 僅頁內 redirect，middleware 層不一致 |
| 修復方式 | 將 \`/admin/users\` 加入 PROTECTED 或抽共用 guard |

### TD-003

| 檔案位置 | \`env.ts\` vs \`.env.example\` |
| 問題描述 | CRON_SECRET、PAGEVIEW_HASH_SALT、REDIRECT_LOOKUP_SECRET 未在 t3-env 驗證 |
| 影響範圍 | 建置通過但執行期 401/503 |
| 修復方式 | 擴充 env.ts 或分 integrationEnv schema |

### TD-004

| 檔案位置 | \`wrangler.toml\` [vars] |
| 問題描述 | 含 ALERT_EMAIL_TO、GA 帳號等非 secret 個資/設定於 Git |
| 影響範圍 | 倉庫可見設定值 |
| 修復方式 | 移至 wrangler secret 或 Dashboard 變數 |

### TD-005

| 檔案位置 | \`lib/blog/public-blog-supabase.ts\` + \`lib/blog/load-blog-post-data-prisma.ts\` |
| 問題描述 | 雙 loader 路徑並存 |
| 影響範圍 | 行為不一致風險、維護成本 |
| 修復方式 | 文件標註 CF/Vercel 預設路徑；長期統一 adapter |

### TD-006

| 檔案位置 | \`app/api/cron/cleanup/route.ts\` 第 62-67 行 |
| 問題描述 | AI_JOB_DEAD_LETTER 僅 logger，nodemailer 未接線 |
| 影響範圍 | 死信無郵件告警 |
| 修復方式 | 呼叫 \`lib/alert/resolve-alert-email.ts\` + 寄信實作 |

### TD-007

| 檔案位置 | \`next.config.ts\` eslint.ignoreDuringBuilds: true |
| 問題描述 | production build 不跑 ESLint |
| 影響範圍 | 僅 CI lint 擋住；本地 build 可能略過 |
| 修復方式 | 維持 CI；或 build 啟用 lint |

---

*報告結束。第 2 節含 491 個檔案之逐檔說明（由靜態掃描產生，每檔含功能說明欄位之前 25 行與 export 列表）。*
`;

fs.writeFileSync(path.join(root, "docs/CODEBASE-AUDIT-REPORT.md"), base + append);
console.log("appended", append.length);
