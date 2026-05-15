import { z } from "zod";

/** 媒體契約（對齊 next/image 與 CLS） */
export const imageMediaSchema = z.object({
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1),
  blurHash: z.string().optional(),
});

export type ImageMedia = z.infer<typeof imageMediaSchema>;

const paragraphBlock = z.object({
  type: z.literal("paragraph"),
  data: z.object({
    html: z.string(),
  }),
});

const imageBlock = z.object({
  type: z.literal("image"),
  data: imageMediaSchema,
});

const codeBlock = z.object({
  type: z.literal("code"),
  data: z.object({
    code: z.string(),
    language: z.string().optional(),
  }),
});

const quoteBlock = z.object({
  type: z.literal("quote"),
  data: z.object({
    text: z.string().min(1),
    cite: z.string().optional(),
  }),
});

export const contentBlockSchema = z.discriminatedUnion("type", [
  paragraphBlock,
  imageBlock,
  codeBlock,
  quoteBlock,
]);

export type ContentBlock = z.infer<typeof contentBlockSchema>;

export const contentBlocksSchema = z.array(contentBlockSchema);

export type ContentBlocksDoc = {
  "zh-TW"?: unknown;
  en?: unknown;
};

/** 解析單一語系的區塊陣列；支援舊版「純陣列」＝繁中 */
export function parseContentBlocksForLocale(
  doc: unknown,
  locale: "zh-TW" | "en"
): ContentBlock[] {
  if (doc == null) return [];

  if (Array.isArray(doc)) {
    const r = contentBlocksSchema.safeParse(doc);
    return r.success ? r.data : [];
  }

  if (typeof doc !== "object") return [];

  const o = doc as ContentBlocksDoc;
  const raw = o[locale] ?? o["zh-TW"];
  if (!Array.isArray(raw)) return [];

  const r = contentBlocksSchema.safeParse(raw);
  return r.success ? r.data : [];
}
