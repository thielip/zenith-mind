# 公開部落格資料載入路徑

| 執行環境 | 預設 loader | 檔案 |
|----------|-------------|------|
| Cloudflare Worker（`CF_WORKER_RUNTIME=1`） | Supabase REST | `lib/blog/public-blog-supabase.ts`、`lib/blog/public-blog-post-supabase.ts` |
| Vercel / 本機 `next dev` | Prisma（可 fallback） | `lib/blog/load-blog-post-data-prisma.ts`、`lib/blog/load-blog-list-data-prisma.ts` |

上層入口：`lib/blog/load-blog-post-data.ts`、`lib/blog/load-blog-list-data.ts` 依 runtime 分派。

長期目標：統一 repository 介面，呼叫端不感知底層差異。
