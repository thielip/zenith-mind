import type { BlogPostAuthor } from "@/lib/blog/blog-post-types";

/** 公開站作者顯示（不暴露完整 email） */
export function mapBlogPostAuthor(id: string, email: string): BlogPostAuthor {
  const local = email.split("@")[0]?.trim() ?? "";
  const displayName =
    local.replace(/[._-]+/g, " ").trim() || "Zenith Mind";
  return { id, displayName };
}
