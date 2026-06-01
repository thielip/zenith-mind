import type { PublicContentRepository } from "@/domain/content/ports";
import type { PublicReadRepository } from "@/domain/content/public-read.port";
import { isPublicCfBackend } from "@/lib/public-content/runtime";

export async function getPublicReadRepository(): Promise<PublicReadRepository> {
  if (isPublicCfBackend()) {
    const { publicReadSupabaseRepository } = await import(
      "@/infrastructure/content/public-read-supabase.repository"
    );
    return publicReadSupabaseRepository;
  }

  const { publicReadPrismaRepository } = await import(
    "@/infrastructure/content/public-read-prisma.repository"
  );
  return publicReadPrismaRepository;
}

/** @deprecated 使用 getPublicReadRepository */
export async function getPublicContentRepository(): Promise<PublicContentRepository> {
  return getPublicReadRepository();
}
