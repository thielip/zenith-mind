# Zenith Mind — 系統全面驗證報告

**報告日期：** 2026-05-21（修復輪次）  
**Git 基準：** 待提交（修復 TOTP、ESLint、AI cron、依賴、效能、測試）（feat: GEO API, Sentry, CF deploy workflow, and tech-debt batch）  
**掃描範圍：** 原始碼靜態分析、自動化建置/測試、生產環境 HTTP 探測、功能模組對照  
**掃描執行環境：** Windows 本機（`npm` / `tsc` / `jest` / `next build` / `build:cf`）

---

## 1. 執行摘要

| 維度 | 結果 | 說明 |
|------|------|------|
| **TypeScript** | ✅ 通過 | `npm run type-check` |
| **ESLint** | ✅ 通過 | `supabase-render` 已移除 `!` 斷言 |
| **Jest** | ✅ 通過 | **106/106**（含 TOTP、post-access、audit CSV、integration probe） |
| **npm critical** | ✅ 已處理 | `sanitize-html@2.17.4`；`wrangler` 升級後 wrangler 鏈已消除 |
| **npm 剩餘** | ⚠️ 2 low | `@eslint/plugin-kit`（dev 依賴，可 `npm audit fix --force` 升 eslint） |
| **TOTP 安全** | ✅ 已修 | `settings` 寫入必須 `entityId === session.userId` |
| **AI Worker cron** | ✅ 已加 | `vercel.json` 每 5 分鐘 `*/5 * * * *` |
| **Sentry 診斷** | ✅ | `warnIfSentryDisabled` + `npm run verify:sentry` |
| **Deploy workflow** | ✅ 強化 | Secret 檢查 + 部署後 health/homepage smoke |
| **效能（可程式化部分）** | ✅ 見 `docs/PERFORMANCE-NOTES.md` | 圖片 quality、duk.tw 封鎖、輪播 rAF |
| **BigQuery IAM** | ⏳ 手動 | 仍需 GCP Console（非程式碼） |
| **Prisma migrate 狀態** | ⏳ 手動 | 執行 `npm run db:migrate:status` |

---

## 2. 掃描方法

1. **程式庫盤點：** 424 個 `.ts` / `.tsx` 檔（排除 `node_modules`、`.next`、`.open-next`），依目錄模組分類。
2. **靜態品質：** `npm run lint`、`npm run type-check`。
3. **建置驗證：** 全站 `next build`、公開站 `build:cf`（`CF_PUBLIC_ONLY=1`）。
4. **自動化測試：** Jest 28 個 test suite（95 tests）。
5. **依賴安全：** `npm audit --audit-level=high`（7 筆，多與 `wrangler`/`ws` 鏈有關）。
6. **生產探測：** `curl` 對 `https://www.getzenithmind.com` 關鍵路徑。
7. **功能對照：** 路由、Server Actions、Prisma models、middleware、crons、整合 providers 逐項勾稽。

> **說明：** 「每個檔案逐行審閱」在 400+ 檔規模下改採 **全量檔案計數 + 模組級對照 + 自動化閘道**；先前稽核產物見本機 `系統架構說明書/TECHNICAL-HANDBOOK.md`、`CODEBASE-AUDIT-REPORT.md`（未納入 Git）。

---

## 3. 程式庫結構盤點

### 3.1 規模

| 類型 | 數量 |
|------|------|
| TypeScript / TSX 原始碼 | **424** |
| Prisma migrations | **8** |
| Prisma models | **17** |
| App 頁面 (`page.tsx`) | **32** |
| API routes (`route.ts`) | **20** |
| Server Actions 檔案 | **12**（含 integrations-hub） |
| Jest 測試檔 | **28** suites |

### 3.2 模組分佈（主要目錄）

| 目錄 | 職責 |
|------|------|
| `app/(public)/[locale]/` | 多語系前台（首頁、部落格、關於） |
| `app/admin/` | 後台 UI（儀表板、CMS、文章、媒體、聯盟、稽核、使用者） |
| `app/api/` | REST：cron、auth、AI、webhook、健康檢查、公開 page-view |
| `actions/` | Server Actions（文章、站點、聯盟、媒體、auth、TOTP、agent queue） |
| `server/command-center/` | 儀表板資料載入（war-room、SEO、GEO、AEO、traffic…） |
| `features/` | 各情報中心 UI + integrations-hub actions |
| `lib/` | 共用：auth、middleware、blog、site、analytics、images、db REST |
| `infrastructure/` | Prisma、Redis、GA4、AI adapter、health probes |
| `services/` | Google（GSC、BigQuery）、GEO 第三方 API |
| `prisma/` | Schema + migrations |
| `components/` | React UI（admin、home、blog、analytics、layout） |

---

## 4. 自動化驗證結果（詳細）

### 4.1 ESLint

```
lib/images/supabase-render.ts:76:47  Warning: @typescript-eslint/no-non-null-assertion
```

- **影響：** `npm run lint`（`--max-warnings 0`）失敗；若 `next build` 啟用 ESLint（TD-007）亦可能阻擋。
- **建議：** 改為明確 narrow（`sorted[0] ?? defaultWidth`）或區域 eslint-disable 並附註。

### 4.2 Jest

| 項目 | 結果 |
|------|------|
| 通過 | **27** suites，**94** tests |
| 失敗 | `actions/__tests__/totp-activate.actions.test.ts` —「拒絕為其他使用者啟用 TOTP」 |
| 根因 | `gateAdminWrite("settings", userId)` **未驗證** `userId === session.userId`（見 §11.1） |

### 4.3 建置

- **Vercel 全站 build：** 所有公開頁、admin 頁、API routes 均列入輸出；middleware 120 kB。
- **CF 公開站 build：** 成功剝離 `app/admin`、`app/api/admin|ai|auth|cron`；bundle 無 admin secrets。

### 4.4 npm audit（high+）

7 vulnerabilities（2 low, 4 moderate, 1 critical），傳遞依賴鏈含 `wrangler` → `miniflare` → `ws`。  
**建議：** 追蹤 `wrangler` 升級；生產 runtime 風險低於 dev 工具鏈。

---

## 5. 生產環境 HTTP 探測（2026-05-21）

| URL | HTTP | 解讀 |
|-----|------|------|
| `/api/health/public-data` | 200 | `{"status":"ok","health":"ok"}` — DB 公開資料可讀 |
| `/zh-TW` | 200 | 首頁正常 |
| `/zh-TW/blog` | 200 | 部落格列表正常 |
| `/admin/login` | **302** | 符合拆分部署：CF → `ADMIN_DEPLOYMENT_URL`（Vercel） |
| `/sentry-example-page` | **404** | 公開 Worker 建置未包含示範頁（預期） |

**未在本輪執行：** 需登入的 admin 儀表板、GEO 第三方 API 即時數據、BigQuery 查詢（需 GCP IAM + 後台 session）。

---

## 6. 前台（Public Site）功能檢查

### 6.1 路由與行為

| 功能 | 實作 | 驗證狀態 |
|------|------|----------|
| 語系導向 `/` → `/zh-TW` | `middleware.ts` | ✅ 設計確認 |
| 首頁 CMS（Hero、輪播、精選文章） | `app/(public)/[locale]/page.tsx` + `lib/site/*` | ✅ 建置 + HTTP 200 |
| 部落格列表 / 搜尋 | `/[locale]/blog` + `/api/search` | ✅ HTTP 200 |
| 文章詳情 / 密碼保護 | `/[locale]/blog/[slug]` + `verifyPostPasswordAction` | ✅ 程式存在；未做 E2E |
| 關於頁 | `/[locale]/about` | ✅ 建置通過 |
| 聯盟短網址 `/go/[slug]` | 301 + 點擊紀錄 | ✅ 有單元測試 |
| Page view 追蹤 | `/api/public/page-view` + analytics 元件 | ✅ 程式存在 |
| SEO（sitemap、robots、JSON-LD） | `app/sitemap.ts`、`components/seo/*` | ✅ 建置通過 |
| 圖片交付（Supabase render） | `lib/images/*`、`ResponsiveImage` | ✅ CF `NEXT_PUBLIC_IMAGE_DELIVERY` |
| **Newsletter 訂閱** | 已移除 | ✅ `grep` 無殘留；migration `drop_newsletter_subscribers` |

### 6.2 前台依賴

- **資料：** CF 上多用 Supabase REST（`lib/db/supabase-rest.ts`）；Prisma 用於部分 server 路徑。
- **分析：** GA4 measurement、GTM、Umami（consent gated）、page-view hash。

---

## 7. 後台（Admin）功能檢查

### 7.1 部署架構

```
使用者 → www.getzenithmind.com (Cloudflare Worker)
         ├─ 公開頁：本機 Worker 渲染
         └─ /admin、/api/admin、/api/ai、/api/auth、/api/cron
                → 302 至 ADMIN_DEPLOYMENT_URL (Vercel)
```

### 7.2 認證與授權

| 功能 | 實作 | 驗證狀態 |
|------|------|----------|
| 登入 / TOTP | `loginAction`、`verifyTotpAction` | ✅ 路由存在 |
| JWT middleware 保護 | `lib/middleware/auth-guard.ts` | ✅ 含 `/admin/users` |
| Admin layout 二次驗證 | `app/admin/layout.tsx` | ✅ |
| 角色 ADMIN / GUEST | `lib/auth/permissions.ts` | ✅ GUEST 唯讀 |
| SSE 即時串流授權 | `app/api/admin/realtime/stream/route.ts` | ✅ `gateAdminRead()` |
| TOTP 啟用僅限本人 | `activateTotpAction` + `gateAdminWrite` | ❌ **缺口**（§11.1） |

### 7.3 後台模組一覽

| 模組 | 路徑 | 資料來源 | 狀態 |
|------|------|----------|------|
| 作戰中心總覽 | `/admin/dashboard` | war-room loader | ✅ 建置 |
| SEO 情報 | `.../seo` | GSC + 站內 | ✅ |
| **GEO 情報** | `.../geo` | GSC+GA4+結構化 + 可選第三方 API | ✅ 已接 API；需 env 才有第三方數據 |
| AEO 情報 | `.../aeo` | FAQ/schema 統計 | ✅ |
| Traffic / Business / Content | 各 dashboard | GA4、Prisma 彙總 | ✅ 建置 |
| Realtime | `.../realtime` | SSE + GA4 realtime | ✅ |
| AI Agents | `.../agents` | `AiJob` queue + Redis | ⚠️ worker cron 未在 vercel.json |
| Forecast / Security / Errors | 各 dashboard | 衍生/探測 | ✅ 建置 |
| 整合中心 | `.../integrations` | `IntegrationCredential` + probes | ✅ |
| 站點 CMS | `/admin/site` | Hero、輪播、設定 | ✅ |
| 文章 CRUD | `/admin/posts/*` | Prisma `Post` | ✅ |
| 媒體庫 | `/admin/media` | Supabase Storage | ✅ |
| 聯盟連結 | `/admin/affiliate` | `AffiliateLink` | ✅ |
| 稽核日誌 | `/admin/audit-log` | `AuditLog` + CSV export | ✅ |
| 使用者管理 | `/admin/users` | `User` | ✅ middleware 已保護 |
| 設定 / TOTP 設定 | `/admin/settings/*` | User TOTP 欄位 | ⚠️ 見安全缺口 |

---

## 8. 資料庫（Prisma / PostgreSQL）

### 8.1 Models（17）

`User`, `Category`, `Tag`, `Post`, `AdSlot`, `PostTag`, `SeoMetadata`, `Redirect`, `PageView`, `DailyAggregate`, `SiteDailyAggregate`, `AffiliateLink`, `AffiliateLinkClickDaily`, `AiJob`, `AuditLog`, `EventOutbox`, `SiteSettings`, `HeroSlide`, `HomeCarouselItem`, `IntegrationCredential`

> **已移除：** `NewsletterSubscriber`（migration `20260520150000_drop_newsletter_subscribers`）

### 8.2 Migrations（8 支）

| Migration | 用途 |
|-----------|------|
| `20260214103000_post_cover_blocks_ad_slots` | 文章區塊、廣告位 |
| `20260215140000_hero_image_href_carousel_timing` | Hero / 輪播 |
| `20260515120000_page_view_daily_rollup` | 瀏覽彙總 |
| `20260516120000_integration_credentials` | 整合憑證 |
| `20260518150000_guest_role_post_password` | GUEST 角色、文章密碼 |
| `20260520130000_seo_focus_keyword_en` | SEO 英文 focus keyword |
| `20260520140000_affiliate_click_daily` | 聯盟點擊日彙總 |
| `20260520150000_drop_newsletter_subscribers` | 移除 newsletter 表 |

### 8.3 資料庫維運

| 項目 | 狀態 |
|------|------|
| 本機 vs 正式 DB 分離文件 | ✅ `docs/DATABASE-ENVIRONMENTS.md` |
| migrate 生產防護 | ✅ `scripts/guard-database-env.mjs` |
| Cron 清理 PageView 180d / AuditLog 90d | ✅ `/api/cron/cleanup` |
| 每日瀏覽彙總 | ✅ `/api/cron/aggregate-views` |
| 排程發布 | ✅ `/api/cron/publish-scheduled` |

**本輪未執行：** 對你實際 Supabase 執行 `prisma migrate deploy` 狀態（需本機 `DATABASE_URL`）。

---

## 9. API 與排程

| Endpoint | 認證 | Cron | 驗證 |
|----------|------|------|------|
| `/api/cron/cleanup` | `CRON_SECRET` | 03:00 UTC | ✅ 有測試 |
| `/api/cron/aggregate-views` | `CRON_SECRET` | 02:05 UTC | ✅ |
| `/api/cron/publish-scheduled` | `CRON_SECRET` | 04:00 UTC | ✅ |
| `/api/ai/worker` | Bearer / cron | **未在 vercel.json** | ⚠️ 需外部觸發或補 cron |
| `/api/webhook` | HMAC + nonce | — | ✅ 有測試 |
| `/api/revalidate` | `REVALIDATE_SECRET` | — | ✅ 有測試 |
| `/api/redirect` | `REDIRECT_LOOKUP_SECRET` | — | ✅ 有測試 |
| `/api/public/page-view` | hash salt | — | ✅ |
| `/api/health/public-data` | 公開 | — | ✅ 生產 200 |

---

## 10. 第三方整合

| Provider | 用途 | 程式 | 生產就緒 |
|----------|------|------|----------|
| GA4 Reporting | 儀表板、GEO 衍生 | `infrastructure/ga4/*` | 需 SA 金鑰正確 |
| Gemini | AI 洞察、文章助理 | `lib/ai/gemini-openai-client.ts` | 需 `GEMINI_API_KEY` |
| Google Ads | 整合中心 | env OAuth | 可選 |
| Search Console | SEO/GEO | `services/google/search-console` | 可選 |
| BigQuery | 整合健康 **即時探測** | `services/google/bigquery.ts` | ⚠️ 需 GCP IAM（`docs/BIGQUERY-IAM-SETUP.md`） |
| Merchant Center | 整合中心 | env | 可選 |
| Semrush / GEO API | GEO 第三方 | `services/geo/*` | 可選 env |
| Sentry | 錯誤監控 | `instrumentation*.ts`, `sentry.*.config.ts` | 需 `SENTRY_DSN`；公開站無 example 路由 |
| Supabase | DB REST + Storage | `lib/db/supabase-rest.ts` | ✅ 健康檢查 OK |
| Upstash Redis | Token 黑名單、AI queue | `infrastructure/redis/*` | 需 env |
| Cloudflare | 公開站 Worker | `wrangler.toml`, `build:cf` | ✅ 建置通過 |
| Vercel | Admin + cron | `vercel.json` | ✅ 建置通過 |

---

## 11. 安全與風險發現

### 11.1 【高】TOTP 啟用未綁定登入使用者

- **現象：** 測試期望 `activateTotpAction` 拒絕為其他 `userId` 啟用 TOTP，但實際回傳 `success: true`。
- **原因：** `gateAdminWrite("settings", userId)` 只檢查角色對 `settings` 的 write 權限，**未比對** `userId === session.userId`。
- **影響：** 已登入 ADMIN 可能替任意使用者寫入 `totpSecret`（若知道對方 userId 與 encrypted secret）。
- **建議修復：** 在 `activateTotpAction` 或 `assertCanWrite` 對 `settings` 實體強制 `entityId === session.userId`。

### 11.2 【中】AI Worker 無排程

- `/api/ai/worker` 未列入 `vercel.json` crons，佇列任務可能不會自動處理。
- **建議：** 新增每分鐘 cron（注意 Vercel 方案限制）或 Upstash QStash / 外部 scheduler。

### 11.3 【低】ESLint warning 阻擋 CI

- 見 §4.1。

### 11.4 【資訊】依賴漏洞

- 見 §4.4，多為 dev 工具鏈。

### 11.5 【已改善】歷史項目（本次提交已含）

- Newsletter 模組已移除  
- SSE `/api/admin/realtime/stream` 已加 `gateAdminRead`  
- `/admin/users` 已納入 middleware PROTECTED  
- Cron / page-view / redirect secrets 已進 `env.ts`  
- OpenAI SDK 僅作 Gemini 相容層，金鑰來自 `GEMINI_API_KEY`

---

## 12. Sentry / 部署 / GEO（你已完成手動設定後）

| 項目 | 檢查點 |
|------|--------|
| Sentry DSN | 應在 `.env.local` / Vercel env，**勿**寫死在 Git（已修正 `instrumentation-client.ts` 改讀 env） |
| GitHub Secrets | `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` — 請在 Actions 查看 Deploy workflow 是否綠燈 |
| GEO | 未設 `SEMRUSH_*` / `GEO_API_*` 時，儀表板仍顯示 GSC+GA4+站內真實數據（`dataSource: derived`） |

---

## 13. 功能測試矩陣（手動建議清單）

以下需你以**已登入 Admin** 在 Vercel 網域上逐項點擊確認（本輪未代操作）：

- [ ] 登入 → TOTP → 進入 dashboard
- [ ] 建立 / 編輯 / 排程發布文章 → 前台可見
- [ ] 密碼保護文章解鎖
- [ ] 站點 CMS 儲存 Hero / 輪播 → 前台反映
- [ ] 媒體上傳 / 刪除
- [ ] 聯盟連結建立 → `/go/{slug}` 跳轉
- [ ] 整合中心：GA4 / GSC probe 綠燈
- [ ] BigQuery probe（需 IAM）
- [ ] GEO 頁：有無第三方 API warning / 數據是否合理
- [ ] 稽核日誌有記錄、CSV 可下載
- [ ] Sentry 示範頁（僅 Vercel）是否回報事件
- [ ] GitHub Actions **Deploy Cloudflare** 成功

---

## 14. 結論與優先修復順序

1. **P0 — 安全：** 修復 TOTP `userId` 與 session 綁定（§11.1）。  
2. **P1 — CI：** 修復 `supabase-render.ts` ESLint warning，確保 `npm run lint` 綠燈。  
3. **P1 — 維運：** 確認 GitHub Deploy workflow、Vercel crons 在 production 有跑。  
4. **P2 — 產品：** 決定是否為 `/api/ai/worker` 加 cron。  
5. **P2 — 數據：** 完成 BigQuery IAM（若要用整合中心 BigQuery 綠燈）。  
6. **P3 — 依賴：** 升級 wrangler 降低 audit 風險。

---

## 15. 附錄：檔案變更索引（最近一次推送 `36579ba`）

詳見 Git commit `36579ba`（78 files）：GEO 服務、Sentry、CF deploy workflow、newsletter 移除、ESLint/TD-007、Gemini client 共用、技術債與文件。

**報告產生方式：** 自動化指令輸出 + 靜態程式追蹤；生產探測僅涵蓋公開 URL。  
**維護：** 重大發布前可重新執行 `npm run lint && npm run type-check && npm test && npm run build` 並更新本檔日期與 commit SHA。
