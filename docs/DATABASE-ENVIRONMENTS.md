# 資料庫環境分離（本機 vs Production）

## 你觀察到的現象

若本機 `npm run dev` 與 Vercel Production 的 `DATABASE_URL` / `DIRECT_URL` 都指向：

`aws-1-ap-northeast-1.pooler.supabase.com:5432`（或同專案其他 port）

代表**兩邊連的是同一個 Supabase 專案**，不是程式自動切換，而是**環境變數填了同一份連線字串**。

| 連線 | 常見 port | 用途 |
|------|-----------|------|
| Transaction pooler | **6543** | App 執行期（`DATABASE_URL`） |
| Session / Direct | **5432** | Prisma migrate、`DIRECT_URL` |

同一 host、不同 port **仍是同一個資料庫**。

## 是否需要修正？

| 情境 | 建議 |
|------|------|
| 只有你維護、刻意用線上 DB 開發 | 可接受，但**禁止**在本機跑破壞性 migration／測試腳本 |
| 團隊開發、或會跑 seed／migrate dev | **必須分離**：另建 Supabase **Dev** 專案，或本機 Docker Postgres |
| Production 已有真實流量與內容 | **強烈建議分離**，避免本機誤刪文章、誤改設定 |

## 建議作法（推薦）

1. **Supabase 再開一個專案**（例如 `zenith-mind-dev`）。
2. **本機** `.env.local` 只填 Dev 專案的 `DATABASE_URL` + `DIRECT_URL`。
3. **Vercel Production** 維持現有 Production 連線（Dashboard → Environment Variables → Production only）。
4. **Vercel Preview**（可選）可用 Dev 或獨立 Staging 專案。
5. 本機指令分工：
   - `npm run db:migrate` → 只對 **Dev** DB
   - `npm run db:deploy` → 只在 **CI 或明確 production 維運** 執行

## 如何確認目前連到哪裡

```bash
node --env-file=.env.local scripts/db-connection-info.mjs
```

比對輸出的 `databaseHost` 與 Supabase Dashboard → Project Settings → Database 是否為同一專案。

## 防呆（專案內建）

- `scripts/prisma-with-local-env.mjs` 在 `migrate dev` / `migrate deploy` 前會提示 Supabase 連線。
- 若**必須**對 Production 跑 migrate deploy，請設：

```env
ALLOW_PRODUCTION_DATABASE=1
```

（僅限你清楚風險時使用。）
