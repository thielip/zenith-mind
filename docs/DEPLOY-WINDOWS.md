# Windows 本機部署 Cloudflare

## 為什麼 `wrangler deploy` 失敗？

1. **`CF_PUBLIC_ONLY=1 npm run build:cf` 是 Linux/bash 語法**  
   PowerShell 會報：`CF_PUBLIC_ONLY 不是內部或外部命令`（你看到的亂碼錯誤）。

2. **`npm run build:cf` 其實已成功**  
   失敗發生在 **deploy 階段** Wrangler 又觸發 `wrangler.toml` 的 `[build]` 重跑。

3. **OpenNext 不建議在 Windows 上 deploy**  
   即使略過重建，也可能出現 `No such module "cloudflare/images.js"`。  
   **請在 Linux 環境部署**（GitHub Actions 或 WSL）。

## 建議做法（Dashboard 503 時）

### 方法 1：GitHub Actions（推薦）

1. 打開 https://github.com/thielip/zenith-mind/actions/workflows/deploy.yml  
2. **Run workflow** → 分支 `main`（須為最新 workflow；若 job 顯示 Skipped，請 pull 含 `workflow_dispatch` if 修正的 commit）  
3. 確認 Secrets 已設：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`  
4. 等綠燈後驗證 https://www.getzenithmind.com/zh-TW  

若 **Deploy Cloudflare**（GHA）失敗但 **Workers Builds**（Cloudflare Git）成功，公開站可能已上線；GHA 應使用 `wrangler deploy --no-bundle`（見 `scripts/cf-gha-deploy.mjs`），不要用 `opennextjs-cloudflare deploy`（CI 易在 `getPlatformProxy` 失敗）。

### 方法 2：WSL（本機）

```bash
cd /mnt/c/Users/xxx/Documents/training/zenith-mind
export CF_PUBLIC_ONLY=1 SKIP_ENV_VALIDATION=true
export NODE_OPTIONS=--max-old-space-size=8192
npm run build:cf
CF_SKIP_BUILD=1 npx wrangler deploy --no-bundle
```

### 方法 3：PowerShell（僅建置；部署請用 Actions/WSL）

```powershell
npm run build:cf
# 不要在 Windows 上 wrangler deploy（bundle 可能無效）
```

若已拉最新程式，也可：

```powershell
npm run deploy:cf
```

（腳本會設 `CF_SKIP_BUILD=1`；若仍出現 `cloudflare/images.js`，請改方法 1 或 2。）
