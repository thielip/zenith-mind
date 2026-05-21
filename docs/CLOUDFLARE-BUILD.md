# Cloudflare 建置（OpenNext）

## 建置命令

```bash
CF_PUBLIC_ONLY=1 SKIP_ENV_VALIDATION=true NODE_OPTIONS=--max-old-space-size=8192 npm run build:cf
```

Dashboard 若自訂建置命令，請**務必**含 `CF_PUBLIC_ONLY=1`（或與 `wrangler.toml` `[build] command` 一致）。

OpenNext 會執行 `npm run build:next:public`（見 `open-next.config.ts`），在子程序內再次設定 `CF_PUBLIC_ONLY=1`。

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

1. 成功建置 log 應出現 `[cf-public-build] CF_PUBLIC_ONLY=1` 與 `[cf-next-build] CF_PUBLIC_ONLY=1`，且 Next 顯示 `Skipping linting`。
2. 確認已推送含 `build:next:public` / `open-next.config.ts` buildCommand 的 commit。
3. Cloudflare Dashboard 建置命令需含 `CF_PUBLIC_ONLY=1`；僅 `SKIP_ENV_VALIDATION` 時 `next.config` 仍會略過 lint/tsc（備援）。
4. 清除 Build cache 後重試部署。
5. 品質把關改在 GitHub Actions：`npm run type-check`、`npm run lint`。
6. 可再加環境變數 `NODE_OPTIONS=--max-old-space-size=8192`（腳本已內建預設）。
