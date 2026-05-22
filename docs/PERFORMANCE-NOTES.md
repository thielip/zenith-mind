# 效能與 Lighthouse 備註

## 程式碼已處理

- **圖片體積：** Supabase render 預設 `quality=68`；Hero `52`、主題卡 `54`、輪播卡 `54`。
- **Logo：** `resolveSiteLogoSrc` 阻擋 `duk.tw`，回退 `/logo.png`；`logoPreload` 提早載入。
- **快取：** `/logo.png` 與 `/_next/static` 一年；一般 `*.png` 7 天（`public/_headers`）。
- **強制重排：** 首頁輪播 `scrollLeft` 讀寫包在 `requestAnimationFrame`。
- **失效圖床：** `duk.tw` 等 host 於 `lib/validation/blocked-image-hosts.ts` 阻擋（含 CMS 驗證與 `mapSiteSettingsRow`）。
- **Sentry CSP：** `connect-src` 含 `*.ingest.sentry.io` / `*.ingest.us.sentry.io`。
- **後台首頁：** `AdminHeader` → `getPublicLocaleHomeUrl("zh-TW")`（`https://www.getzenithmind.com/zh-TW`）。
- **分析腳本：** GA/GTM 僅在同意 + 互動/20s 後載入（`ConsentGatedAnalytics`）。
- **Polyfill：** `.browserslistrc` 鎖定現代瀏覽器。

## 需在 Cloudflare / GTM 後台處理（非程式碼）

| 項目 | 說明 |
|------|------|
| `static.cloudflareinsights.com/beacon.min.js` | Cloudflare Web Analytics 自動注入；1 天 TTL 由 CF 控制。若與 GA4 重複可於 CF Dashboard 關閉 Web Analytics。 |
| `api.trustedform.com` 長鏈 | 通常來自 **GTM 容器** 內標籤；請改為延遲觸發（Consent 後 / scroll 後），或移除未使用標籤。 |
| `duk.tw` 502 | 若 DB 仍存舊 URL，請於 **Admin → 站點 CMS** 改為 Supabase 或有效圖址；程式已不再渲染該 host。 |
