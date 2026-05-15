export const DEFAULT_CATEGORIES = [
  { slug: "international", name: "國際視野", nameEn: "Global Perspectives", oldSlugs: ["real-estate"] },
  { slug: "finance", name: "金融世界", nameEn: "Finance World", oldSlugs: ["quant"] },
  { slug: "ai-tech", name: "AI科技", nameEn: "AI Technology", oldSlugs: ["ai-tech"] },
  { slug: "education", name: "知識教育", nameEn: "Knowledge Education", oldSlugs: ["education"] },
  { slug: "lifestyle", name: "生活玩家", nameEn: "Lifestyle Players", oldSlugs: ["travel"] },
  { slug: "other", name: "其他", nameEn: "Other", oldSlugs: ["ai-creation"] },
] as const;

const CATEGORY_ORDER = new Map<string, number>(
  DEFAULT_CATEGORIES.map((category, index) => [category.slug, index])
);

export function sortDefaultCategories<T extends { slug: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const aOrder = CATEGORY_ORDER.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = CATEGORY_ORDER.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || a.slug.localeCompare(b.slug);
  });
}
