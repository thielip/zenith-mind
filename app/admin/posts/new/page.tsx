// app/admin/posts/new/page.tsx — 新增文章
// Cache 模式 B：force-dynamic

import type { Metadata } from "next";
import { prisma } from "@/infrastructure/db/prisma";
import NewPostForm from "@/components/admin/Editor/NewPostForm";
import { sortDefaultCategories } from "@/lib/categories/defaults";

export const metadata: Metadata = { title: "新增文章 | Admin" };
export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      where:   { deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      where:   { deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <NewPostForm
      categories={sortDefaultCategories(categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })))}
      allTags={tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))}
    />
  );
}
