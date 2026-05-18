-- 公開 REST 讀取文章密碼保護旗標（不含雜湊）
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS "accessPasswordHash" TEXT;

-- 不將 accessPasswordHash 暴露給 PostgREST（僅應用層 Prisma 使用）
NOTIFY pgrst, 'reload schema';
