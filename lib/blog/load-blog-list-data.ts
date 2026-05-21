import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import { safeQuery } from "@/lib/db/safe-query";
import type { BlogListData, BlogListFilters } from "@/lib/blog/blog-list-types";

export type { BlogListData, BlogListFilters, BlogListPost } from "@/lib/blog/blog-list-types";

const EMPTY_BLOG_LIST: BlogListData = {
  posts: [],
  total: 0,
  categories: [],
  tags: [],
};

async function loadBlogListDataCf(
  filters: BlogListFilters,
  skip: number,
  perPage: number
): Promise<BlogListData> {
  const { loadBlogListDataViaSupabase } = await import(
    "@/lib/blog/public-blog-supabase"
  );
  try {
    return await loadBlogListDataViaSupabase(filters, skip, perPage);
  } catch (supabaseError) {
    console.error("[blog.list] Supabase REST failed, trying Prisma Neon", supabaseError);
  }

  const { getPrismaCfEdge } = await import("@/lib/db/prisma-cf-edge");
  const prisma = getPrismaCfEdge();
  if (!prisma) throw new Error("Prisma Edge is not configured (DATABASE_URL)");

  const { loadBlogListDataWithPrisma } = await import(
    "@/lib/blog/load-blog-list-data-prisma"
  );
  return loadBlogListDataWithPrisma(prisma, filters, skip, perPage);
}

export async function loadBlogListData(
  filters: BlogListFilters,
  skip: number,
  perPage: number
): Promise<BlogListData> {
  if (isCfPublicRuntime()) {
    return safeQuery(
      "blog.list",
      () => loadBlogListDataCf(filters, skip, perPage),
      EMPTY_BLOG_LIST
    );
  }

  const { loadBlogListDataPrisma } = await import("@/lib/blog/load-blog-list-data-prisma");
  return loadBlogListDataPrisma(filters, skip, perPage);
}
