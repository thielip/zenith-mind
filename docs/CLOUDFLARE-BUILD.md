# Cloudflare 建置（OpenNext）

## 建置命令

```bash
SKIP_ENV_VALIDATION=true npm run build:cf
```

等同 `wrangler.toml` 的 `[build] command`。

## Node 版本

使用 **Node 22+**（`.node-version` / `package.json` engines）。

在 Cloudflare Pages → Settings → Environment variables 可設：

- `NODE_VERSION` = `22`

## 建置時必要環境變數（Pages Dashboard）

| 變數 | 說明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://www.getzenithmind.com` |
| `ADMIN_DEPLOYMENT_URL` | Vercel 後台網址 |

檢查：`npm run verify:cf-build`（在 Dashboard 變數設定後於 CI 執行）。

## Sentry 與建置失敗

- **執行期**：`NEXT_PUBLIC_SENTRY_DSN` 已寫入 `wrangler.toml` `[vars]`（公開 DSN）。
- **建置期**：僅在設有 `SENTRY_AUTH_TOKEN` 時才上傳 source map；否則自動略過（避免 Pages CI 失敗）。
- **勿**在 Pages 只設 `SENTRY_ORG` / `SENTRY_PROJECT` 而不設 `SENTRY_AUTH_TOKEN`。

Vercel 後台若要 source map：設 `SENTRY_AUTH_TOKEN` + org/project。

## 與 Vercel 差異

| 項目 | Cloudflare `build:cf` | Vercel `npm run build` |
|------|----------------------|-------------------------|
| ESLint / tsc | 略過（`CF_PUBLIC_ONLY=1`，避免 OOM） | 執行 |
| Node heap | `NODE_OPTIONS=--max-old-space-size=6144` | 預設 |
| Admin 路由 | 建置前暫移 | 完整打包 |
| Sentry tunnel | 關閉 | `/monitoring` |

## 常見失敗：JavaScript heap out of memory

若 log 在 `Linting and checking validity of types` 後 OOM：

1. 確認已推送含 `CF_PUBLIC_ONLY` 的 `next.config.ts`（公開站 build 不跑 tsc/ESLint）。
2. 品質把關改在 GitHub Actions：`npm run type-check`、`npm run lint`。
3. 可於 Pages 再加環境變數 `NODE_OPTIONS=--max-old-space-size=6144`（腳本已內建預設）。
