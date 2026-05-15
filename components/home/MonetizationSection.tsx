import type { HomepageCopy } from "@/lib/site/types";

interface Props {
  locale: string;
  copy: HomepageCopy["monetization"];
}

export default function MonetizationSection({ locale, copy }: Props) {
  const isEn = locale === "en";

  return (
    <section id="monetization" className="mx-auto max-w-6xl px-4 py-18">
      <div className="rounded-3xl bg-gray-950 p-8 text-white shadow-xl sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            {isEn ? copy.eyebrowEn : copy.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {isEn ? copy.titleEn : copy.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-300">
            {isEn ? copy.descriptionEn : copy.description}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {copy.items.map((item, idx) => (
            <div key={`${item.title}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-semibold text-white">{isEn ? item.titleEn : item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-300">{isEn ? item.descriptionEn : item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
