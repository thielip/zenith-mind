# Cloudflare 前台部署（複製執行）

`build:cf` 會執行 `scripts/cf-public-build.mjs`：暫移 admin/API 目錄、隱藏 `.env.local`，再跑 `opennextjs-cloudflare build`。**不會把本機 secret 打包進 Worker。**

## 前置

- 已登入：`npx wrangler login`
- 本機 `.env.local` 僅供開發；Worker secret 用 `npx wrangler secret put <NAME>`

## 完整指令（PowerShell）

```powershell
cd C:\Users\xxx\Documents\training\zenith-mind

# 確認腳本存在
Get-Content package.json | Select-String "build:cf"

# 建置公開站（約 2–5 分鐘）
npm run build:cf

# 部署到 Cloudflare Workers
npx wrangler deploy

# 驗證
Invoke-WebRequest -Uri "https://www.getzenithmind.com/zh-TW" -UseBasicParsing | Select-Object StatusCode
```

## 何時需要重新部署？

- `main` 有前台相關變更且要同步到 www 時
- 僅 Vercel 後台變更**不會**自動更新 Cloudflare

## 與 Git 自動部署

若 Cloudflare Dashboard 已連 GitHub，推送後也會觸發 build；本機 `wrangler deploy` 用於立即強制同步。
