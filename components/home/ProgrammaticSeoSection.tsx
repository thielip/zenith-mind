import Link from "next/link";
import type { HomepageCopy } from "@/lib/site/types";

interface Props {
  locale: string;
  copy: HomepageCopy["programmaticSeo"];
}

export default function ProgrammaticSeoSection({ locale, copy }: Props) {
  const isEn = locale === "en";
  const prefix = isEn ? "/en" : "/zh-TW";

  return (
    <section id="programmatic-seo" className="bg-white py-18">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            {isEn ? copy.eyebrowEn : copy.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            {isEn ? copy.titleEn : copy.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            {isEn ? copy.descriptionEn : copy.description}
          </p>
          <Link
            href={`${prefix}/blog`}
            className="mt-6 inline-flex rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            {isEn ? copy.buttonLabelEn : copy.buttonLabel}
          </Link>
        </div>

        <div className="grid gap-4">
          {copy.strategies.map((strategy, index) => (
            <div key={`${strategy.title}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-950">{isEn ? strategy.titleEn : strategy.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{isEn ? strategy.descriptionEn : strategy.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
