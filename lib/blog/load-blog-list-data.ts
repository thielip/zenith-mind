import { safeQuery } from "@/lib/db/safe-query";
import { getPublicReadRepository } from "@/lib/public-content/get-repository";
import type { BlogListData, BlogListFilters } from "@/lib/blog/blog-list-types";

export type { BlogListData, BlogListFilters, BlogListPost } from "@/lib/blog/blog-list-types";

const EMPTY_BLOG_LIST: BlogListData = {
  posts: [],
  total: 0,
  categories: [],
  tags: [],
};

export async function loadBlogListData(
  filters: BlogListFilters,
  skip: number,
  perPage: number
): Promise<BlogListData> {
  const repo = await getPublicReadRepository();
  return safeQuery(
    "blog.list",
    () => repo.loadBlogListData(filters, skip, perPage),
    EMPTY_BLOG_LIST
  );
}
