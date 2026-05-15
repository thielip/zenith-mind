import { ExternalLink } from "lucide-react";
import type { HomepageCopy } from "@/lib/site/types";

interface AffiliateLinkItem {
  name: string;
  slug: string;
  platform: string | null;
  commission: string | null;
}

interface Props {
  locale: string;
  links: AffiliateLinkItem[];
  copy: HomepageCopy["affiliate"];
}

export default function AffiliateLinksSection({ locale, links, copy }: Props) {
  if (links.length === 0) return null;

  const isEn = locale === "en";

  return (
    <section id="affiliate-links" className="bg-white py-16" aria-labelledby="affiliate-links-heading">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              {isEn ? copy.eyebrowEn : copy.eyebrow}
            </p>
            <h2 id="affiliate-links-heading" className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              {isEn ? copy.titleEn : copy.title}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            {isEn ? copy.descriptionEn : copy.description}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {links.map((link) => (
            <a
              key={link.slug}
              href={`/go/${link.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                isEn
                  ? `${link.name}, opens affiliate destination in a new tab`
                  : `${link.name}，於新分頁開啟聯盟導向`
              }
              className="group rounded-2xl border border-gray-200 bg-gray-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-950 group-hover:text-blue-700">
                    {link.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {link.platform || (isEn ? "Recommended link" : "推薦連結")}
                  </p>
                </div>
                <ExternalLink size={16} className="mt-1 text-gray-400 group-hover:text-blue-600" aria-hidden="true" />
              </div>
              {link.commission && (
                <p className="mt-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {link.commission}
                </p>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
