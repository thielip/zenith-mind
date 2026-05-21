# 作戰中心整合開通清單

本文件說明如何把「示範 / 待接 API」改為**站內真實數據**或**第三方即時數據**。

---

## 一、現況對照

| 模組 | 目前狀態 | 要變成真實數據需做 |
|------|----------|-------------------|
| **AEO：FAQ / SEO Meta** | 已接 Prisma（真實） | 在文章編輯器填 FAQ、SEO 中繼資料 |
| **AEO：Featured Snippets** | GSC 真實 | `searchAppearance`（28D），見 `load-aeo.ts` |
| **SEO：GSC 點擊** | GSC OAuth | 見第二節 |
| **GEO 能見度** | GSC+站內真實 | 無 Otterly 時顯示 GSC/GA4/FAQ 準備度；第三方見第六節 |
| **首頁累計瀏覽** | 站內 `page_views` | 確認 Vercel/CF secrets（見第五節） |

---

## 二、Search Console（解決 `insufficient permission`）

### 2.1 確認 GSC 資源類型與 URL 完全一致

1. 開啟 [Google Search Console](https://search.google.com/search-console)
2. 查看已驗證資源是哪一种：
   - **網址前置字元**：`https://www.getzenithmind.com/`（**結尾要有 `/`**）
   - **網域**：`sc-domain:getzenithmind.com`

3. 在 **Vercel**（後台）環境變數設定（與 GSC 資源**一字不差**）：

```env
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://www.getzenithmind.com/
```

若 GSC 是「網域」資源，改為：

```env
GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:getzenithmind.com
```

### 2.2 將服務帳號加入 Search Console（常見失敗：找不到電子郵件）

#### 先確認：你要加的是哪一個 Email？

專案裡 **GA4 API** 用的是（`wrangler.toml` / Vercel）：

`ga4-api-reader@my-blog-analytics-495817.iam.gserviceaccount.com`  
→ GCP 專案：**my-blog-analytics-495817**

你截圖裡新建的是 **另一個** 帳號：

`search-console-api@getzenithmind.iam.gserviceaccount.com`  
→ GCP 專案：**getzenithmind**

兩者不同。請在 GSC 裡嘗試加入 **實際存在於 GCP「服務帳戶」列表裡** 的那一串（建議用複製按鈕，不要手打）。

#### 正確操作步驟

1. [GCP 服務帳戶](https://console.cloud.google.com/iam-admin/serviceaccounts?project=getzenithmind) → 點該帳號 → **金鑰** → **新增金鑰** → JSON（先建金鑰再試 GSC，部分情況較易通過）
2. 複製 **完整** Email（含 `@...iam.gserviceaccount.com`）
3. GSC → **設定** → **使用者和權限** → **新增使用者** → 貼上 → 權限 **完整**
4. 等 10～30 分鐘再試

#### 若仍顯示「找不到電子郵件」

Google 自 **2026 年 4 月下旬** 起有多起回報：服務帳號無法加入 GSC／GA4 使用者列表（系統 Bug，非你設定錯誤）。  
社群討論：[Search Console 社群](https://support.google.com/webmasters/thread/431407723)

**建議改走 OAuth 備援（下方 2.2b）**，後台已支援，無須在 GSC 新增服務帳號。

### 2.2b 備援：OAuth（服務帳號加不進 GSC 時用這個）

用 **你登入 GSC 的 Google 帳號** 授權，不透過服務帳號。

1. GCP 專案 `getzenithmind`（或與 GSC 相同帳號）→ **API 和服務** → **憑證** → **建立憑證** → **OAuth 用戶端 ID** → 類型 **網路應用程式**
2. 已授權重新導向 URI 加：`https://developers.google.com/oauthplayground`
3. 開啟 [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - 齒輪 → 勾選 **Use your own OAuth credentials**，填入 Client ID / Secret
   - Step 1：Scope 填 `https://www.googleapis.com/auth/webmasters.readonly`
   - 用 **擁有 GSC 權限的 Gmail** 登入並授權
   - Step 2：**Exchange authorization code for tokens** → 複製 **Refresh token**
4. 在 **Vercel**（後台）環境變數新增：

```env
GSC_OAUTH_CLIENT_ID=你的-oauth-client-id
GSC_OAUTH_CLIENT_SECRET=你的-oauth-client-secret
GSC_OAUTH_REFRESH_TOKEN=從-playground-複製的-refresh-token
```

5. 重新部署 Vercel，執行 `npx tsx --env-file=.env.local scripts/test-search-console.mjs`

程式會 **優先使用 GSC_OAUTH_***，不再依賴服務帳號是否加進 GSC 使用者列表。

### 2.3 啟用 API

1. [Google Cloud Console](https://console.cloud.google.com) → 選與 GA4 相同的專案
2. **API 和服務** → **程式庫** → 搜尋 **Google Search Console API** → **啟用**

### 2.4 驗證

後台 → **整合中心** → 探測 **Search Console**，或本機：

```bash
npx tsx --env-file=.env.local scripts/test-search-console.mjs
```

成功後 **SEO 情報** 的「GSC 點擊 (28D)」會顯示數字；**AEO** 的 Featured Snippets 可改接 GSC 資料（程式待實作）。

---

## 三、GA4 Reporting API（`DEADLINE_EXCEEDED`）

### 3.1 常見原因

- 服務帳號未加入 GA4 資源的 **檢視者** 權限
- `GA4_PROPERTY_ID` 填成帳戶 ID 而非資源 ID（應為 `536903218` 這類數字）
- 網路慢 / 冷啟動導致 gRPC 逾時

### 3.2 服務帳號金鑰（必備）

`.env.local` / Vercel：

- `GA4_CLIENT_EMAIL`（目前建議：`ga4-api-reader@getzenithmind.iam.gserviceaccount.com`）
- `GA4_PRIVATE_KEY`（GCP JSON 的 `private_key`，`\n` 正確）
- `GA4_PROPERTY_ID=536903218`

啟用 **Google Analytics Data API** 與 **Google Analytics Admin API**。

### 3.2b UI 無法新增信箱時 — OAuth 繞道（與 GSC 類似，但僅一次性授權）

GSC 是「每次 API 用 OAuth」；GA4 是「用 OAuth **幫服務帳號掛權限一次**」，之後仍用金鑰。

```bash
# 可共用 GSC_OAUTH_CLIENT_ID / GSC_OAUTH_CLIENT_SECRET
npx tsx --env-file=.env.local scripts/ga4-oauth-grant.mjs
```

或見 `scripts/GA4-授權服務帳號-備用方案.txt`、`scripts/ga4-grant-playground-curl.ps1`。

### 3.3 驗證

```bash
npx tsx --env-file=.env.local scripts/test-dashboard-ga4.mjs
```

---

## 四、BigQuery

1. 確認 `BIGQUERY_DATASET_ID=my_getzenithmind`（或你的 dataset）
2. 可選：`GOOGLE_CLOUD_PROJECT_ID`（否則從服務帳號 email 推斷）
3. GCP → **IAM** → 服務帳號 → 角色至少：
   - **BigQuery Data Viewer**
   - **BigQuery Job User**（若要查詢）
4. 啟用 **BigQuery API**

---

## 五、Supabase Storage 探測逾時

1. 確認 Vercel 有 `SUPABASE_SERVICE_ROLE_KEY`（`sb_secret_…` 或 legacy JWT）
2. Supabase Dashboard → **Storage** → 存在 bucket **`site-assets`**
3. 若網路慢，整合探測可能逾時；不影響公開站讀圖（公開站用 PostgREST）

---

## 六、GEO（Otterly / Semrush）— 尚未實作

程式位置：`server/command-center/load-geo.ts`（`isDemo: true`）。

要開通需：

1. 向 **Otterly** 或 **Semrush AI Visibility** 申請 API 金鑰與文件
2. 在 `.env` 新增（名稱待產品決定），例如：
   - `OTTERLY_API_KEY`
   - `SEMRUSH_API_KEY`
3. 新增 `services/geo/` 客戶端 + 改寫 `load-geo.ts`
4. 後台整合中心新增探測項目

目前無 API 金鑰時，畫面會維持 Demo 並標示「示範數據」— 屬預期行為。

---

## 七、首頁「累計瀏覽次數」

### 7.1 資料流（簡化版）

1. 有人開首頁 → 瀏覽器 `POST /api/public/page-view`
2. 寫入 Supabase 表 `page_views`（`postId` 為 null）
3. 顯示時 **直接數這張表有幾筆**（同語系 zh-TW / en）
4. 成功記錄後前台數字 +1（不必整頁重新整理）

（日彙總表 / SQL view 為進階優化，目前顯示不依賴它們。）

### 7.2 必要 Secrets（Cloudflare Worker）

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put PAGEVIEW_HASH_SALT
```

### 7.3 驗證（本機對正式站）

```bash
# 記一筆首頁瀏覽
curl -X POST https://www.getzenithmind.com/api/public/page-view \
  -H "Content-Type: application/json" \
  -d "{\"locale\":\"zh-TW\"}"

# 應回 {"ok":true}
```

```bash
npx tsx --env-file=.env.local scripts/verify-homepage-page-views.mjs
```

顯示 **12** 代表目前已有 12 次首頁瀏覽紀錄（含歷史 + 今日），**功能正常**；重新整理首頁應 +1（最多延遲數秒）。

### 7.5 每日彙總（可選）

Vercel Cron 已設定 `app/api/cron/aggregate-views`；需 `CRON_SECRET`。長期統計更準。

---

## 八、建議執行順序

1. GSC 服務帳號權限 + `GOOGLE_SEARCH_CONSOLE_SITE_URL` 修正  
2. GA4 服務帳號 + Property ID + Data API  
3. Cloudflare `PAGEVIEW_HASH_SALT` + `SUPABASE_SERVICE_ROLE_KEY`  
4. Supabase migration  
5. BigQuery IAM（若要用資料倉儲）  
6. GEO 第三方（商務 / 開發排程）

---

## 九、相關腳本

| 腳本 | 用途 |
|------|------|
| `scripts/test-dashboard-ga4.mjs` | GA4 Reporting |
| `scripts/test-search-console.mjs` | Search Console |
| `scripts/verify-homepage-page-views.mjs` | 首頁瀏覽讀寫 |
| `scripts/diagnose-supabase-keys.mjs` | Supabase 金鑰 |
