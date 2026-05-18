// app/admin/posts/[id]/edit/page.tsx — 文章編輯頁
// Cache 模式 B：dynamic = force-dynamic（即時）
// 組裝 Server Component，Client 互動由子元件負責

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/infrastructure/db/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import PostEditor from "@/components/admin/Editor/PostEditor";
import { sortDefaultCategories } from "@/lib/categories/defaults";

export const metadata: Metadata = { title: "編輯文章 | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function toJsonArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  return JSON.parse(JSON.stringify(value)) as unknown[];
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const [post, categories, tags] = await Promise.all([
    prisma.post.findUnique({
      where:   { id, deletedAt: null },
      include: {
        seoMetadata: true,
        tags:        { include: { tag: true } },
        category:    true,
      },
    }),
    prisma.category.findMany({
      where:   { deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      where:   { deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!post) notFound();

  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  let readOnly = false;
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      readOnly = payload.role === "GUEST";
    } catch {
      readOnly = false;
    }
  }

  // Server Component 把資料序列化傳給 Client Component
  return (
    <PostEditor
      readOnly={readOnly}
      post={{
        id:           post.id,
        slug:         post.slug,
        status:       post.status,
        title:        post.title,
        titleEn:      post.titleEn ?? "",
        excerpt:      post.excerpt ?? "",
        excerptEn:    post.excerptEn ?? "",
        content:      String(post.content ?? ""),
        contentEn:    String(post.contentEn ?? ""),
        contentType:  post.contentType,
        coverImage:   post.coverImage ?? "",
        coverImageAlt: post.coverImageAlt ?? "",
        coverImageWidth: post.coverImageWidth ?? null,
        coverImageHeight: post.coverImageHeight ?? null,
        coverImageBlurHash: post.coverImageBlurHash ?? "",
        categoryId:   post.categoryId ?? "",
        scheduledAt:  post.scheduledAt?.toISOString() ?? null,
        isPasswordProtected: post.isPasswordProtected,
        hasAccessPassword: Boolean(post.accessPasswordHash),
        faq:          toJsonArray(post.faq),
        seo: post.seoMetadata
          ? {
              metaTitle:         post.seoMetadata.metaTitle         ?? "",
              metaDescription:   post.seoMetadata.metaDescription   ?? "",
              metaTitleEn:       post.seoMetadata.metaTitleEn       ?? "",
              metaDescriptionEn: post.seoMetadata.metaDescriptionEn ?? "",
              focusKeyword:      post.seoMetadata.focusKeyword      ?? "",
              ogTitle:           post.seoMetadata.ogTitle           ?? "",
              ogDescription:     post.seoMetadata.ogDescription     ?? "",
              noIndex:           post.seoMetadata.noIndex,
            }
          : null,
        tags: post.tags.map((pt) => pt.tag.id),
      }}
      categories={sortDefaultCategories(categories.map((c) => ({
        id: c.id, name: c.name, slug: c.slug,
      })))}
      allTags={tags.map((t) => ({
        id: t.id, name: t.name, slug: t.slug,
      }))}
    />
  );
}
