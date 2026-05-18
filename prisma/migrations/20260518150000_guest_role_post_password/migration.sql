-- GUEST 角色、文章密碼保護
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'GUEST');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "accessPasswordHash" TEXT;
