import type { PublicContentRepository } from "@/domain/content/ports";
import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";

export async function getPublicContentRepository(): Promise<PublicContentRepository> {
  if (isCfPublicRuntime()) {
    const { publicContentSupabaseRepository } = await import(
      "@/infrastructure/content/public-content-supabase.repository"
    );
    return publicContentSupabaseRepository;
  }

  const { publicContentPrismaRepository } = await import(
    "@/infrastructure/content/public-content-prisma.repository"
  );
  return publicContentPrismaRepository;
}
