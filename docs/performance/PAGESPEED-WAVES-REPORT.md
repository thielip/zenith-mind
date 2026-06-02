# PageSpeed 三波優化 — 自我測試報告

**日期：** 2026-06-02  
**狀態：** 本地驗證完成，**尚未 commit / push**（待您審閱後再打包部署）

---

## 1. 異動摘要

### 第 1 波（P0）— 低風險、高影響

| 項目 | 作法 | 檔案 |
|------|------|------|
| 第三方腳本延後 | GA4/GTM/Consent 改由 client-only `dynamic(..., { ssr: false })` 掛載 | `PublicAnalyticsMount.tsx`、`PublicSiteShell.tsx` |
| Clarity 白名單 | 僅在 consent=granted 後載入；`requestIdleCallback`（fallback 1.2s） | `ConsentBanner.tsx` |
| 公開站 CSS 瘦身 | 移除 `globals.css` 內 admin `.command-center` 樣式 | `app/globals.css` |
| Admin 樣式隔離 | Command center 樣式僅在 dashboard layout 引入 | `command-center.css`、`app/admin/dashboard/layout.tsx` |

**預期效果：** 公開首屏少載入 analytics chunk；LCP 路徑 CSS 變小；Clarity/GTM 不再搶首屏主執行緒。

### 第 2 波（P1）— Chunk / 第三方白名單

| 項目 | 作法 | 檔案 |
|------|------|------|
| 公開 bundle 守則 | 文件化禁止從公開 worker 拉 admin 模組 | `lib/build/public-bundle-guard.ts` |
| 建置後稽核 | Top client chunks + 是否混入 dashboard 名稱 | `scripts/perf/public-bundle-audit.mjs`、`npm run perf:bundle-audit` |
| 套件 tree-shake | Vercel 全站 build 對 recharts / framer-motion / react-query 啟用 `optimizePackageImports`（CF 公開 build 不額外拉這些） | `next.config.ts` |

**稽核結果：** `perf:bundle-audit` 未在 top chunks 發現 `command-center` / `war-room` / `dashboard` 命名洩漏。

### 第 3 波（P2）— 編譯基線 + 回歸

| 項目 | 作法 | 檔案 |
|------|------|------|
| 現代瀏覽器基線 | `.browserslistrc` → Chrome/Firefox/Edge ≥120、Safari ≥17 | `.browserslistrc` |
| 注意 | **不可**同時在 `package.json` 設 `browserslist`（會導致 Next build 失敗） | — |

---

## 2. 自我測試結果

| 檢查 | 結果 |
|------|------|
| `npm run type-check` | ✅ 通過 |
| `npm run lint` | ✅ 通過（0 warnings） |
| `npm test` | ✅ **56** suites / **183** tests 全過 |
| 含 login / session | ✅ `login-form`、`client-session` 各通過 |
| `npm run build` | ✅ 通過（約 109s compile） |
| `npm run perf:bundle-audit` | ✅ 執行成功 |

### 建置後 First Load JS（Next 輸出）

| 路由 | Route size | First Load JS |
|------|------------|---------------|
| `/[locale]`（首頁） | 5.39 kB | **237 kB** |
| `/[locale]/blog` | 1.61 kB | 233 kB |
| `/admin/login` | 3.13 kB | **251 kB** |
| Shared baseline | — | 224 kB |

公開頁與登入頁共用 baseline ~224 kB；dashboard 子路由（如 traffic 108 kB + 382 kB）維持獨立 chunk，未擠進公開首屏。

### Polyfills chunk

建置後 `polyfills-*.js` 約 **110 KB**（raw）。`.browserslistrc` 主要影響 autoprefixer/cssnano 與部分 downstream；實際 PSI「Legacy JavaScript」需**部署後**再量一次。

---

## 3. 建議您上線後手動驗收（PSI / 功能）

### 功能（必測）

1. **Admin 登入** `https://zenith-mind.vercel.app/admin/login` — 無 Application error、可登入。
2. **公開首頁** `https://getzenithmind.com/zh-TW` — Header/Footer、文章列表正常。
3. **Cookie 橫幅** — 拒絕：不應載入 Clarity；接受：數秒後才見 Clarity network（非首屏立即）。
4. **Blog** `/zh-TW/blog` 與單篇文章 — 密碼門（若有）與推薦區塊正常。

### PageSpeed（建議同一 URL 部署前後各跑一次）

- Mobile + Desktop
- 關注：**Unused JavaScript**、**Legacy JavaScript**、**Render-blocking resources**、**Third-party**

---

## 4. 尚未執行（依您指示留到審閱後）

- `git commit` / `git push`
- Vercel / Cloudflare 生產部署
- 生產環境 PSI 前後對照數字

---

## 5. 變更檔案清單（工作區）

```
M  .browserslistrc
M  app/admin/dashboard/layout.tsx
M  app/globals.css
M  components/analytics/ConsentBanner.tsx
M  components/layout/PublicSiteShell.tsx
M  next.config.ts
M  package.json
A  app/admin/dashboard/command-center.css
A  components/layout/PublicAnalyticsMount.tsx
A  docs/performance/*
A  lib/build/public-bundle-guard.ts
A  scripts/perf/public-bundle-audit.mjs
```

---

## 6. 審閱通過後 — 打包推送指令（供您確認後執行）

```powershell
cd C:\Users\xxx\Documents\training\zenith-mind
git add .browserslistrc app/admin/dashboard app/globals.css components/analytics components/layout next.config.ts package.json lib/build scripts/perf docs/performance
git commit -m "perf(pagespeed): defer public analytics, scope admin CSS, modern browserslist"
git push origin main
```

部署後請再跑一輪 PSI；若數字滿意即視為三波結案。
