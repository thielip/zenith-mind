import ArticleContent from "@/components/blog/ArticleContent";

interface Props {
  htmlZh: string;
  htmlEn: string;
  headingZh: string;
  headingEn: string;
  headingId: string;
}

/** 法律頁：單一 URL，中文版與英文版 HTML 區塊 */
export default function LegalHtmlArticle({
  htmlZh,
  htmlEn,
  headingZh,
  headingEn,
  headingId,
}: Props) {
  return (
    <article
      className="mx-auto max-w-3xl px-4 py-16"
      aria-labelledby={headingId}
    >
      <h1
        id={headingId}
        className="mb-10 text-3xl font-bold text-gray-900 sm:text-4xl"
      >
        {headingZh}
        <span className="mt-2 block text-2xl font-semibold text-gray-600 sm:text-3xl">
          {headingEn}
        </span>
      </h1>

      <div className="space-y-12">
        <section
          aria-labelledby={`${headingId}-zh`}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2
            id={`${headingId}-zh`}
            className="border-b border-gray-200 pb-3 text-lg font-bold text-gray-900"
          >
            中文版內容
          </h2>
          <div className="mt-6">
            <ArticleContent content={htmlZh} contentType="tiptap" />
          </div>
        </section>

        <section
          aria-labelledby={`${headingId}-en`}
          className="rounded-2xl border border-gray-200 bg-slate-50 p-6 shadow-sm sm:p-8"
        >
          <h2
            id={`${headingId}-en`}
            className="border-b border-gray-200 pb-3 text-lg font-bold text-gray-900"
          >
            英文版內容
            <span className="ml-2 text-base font-medium text-gray-500">
              English
            </span>
          </h2>
          <div className="mt-6">
            <ArticleContent content={htmlEn} contentType="tiptap" />
          </div>
        </section>
      </div>
    </article>
  );
}
