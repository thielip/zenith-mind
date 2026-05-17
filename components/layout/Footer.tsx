// components/layout/Footer.tsx — Server Component

import type { SiteSettingsData } from "@/lib/site/types";

interface Props {
  locale: string;
  settings: SiteSettingsData;
}

function isHiddenFrontendLink(href: string) {
  const normalized = href.toLowerCase();
  return normalized.includes("/admin") || normalized.includes("#newsletter");
}

function normalizeHomeHref(prefix: string, href: string) {
  const trimmed = href.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("#")) return `${prefix}/${trimmed}`;
  if (trimmed.startsWith("/")) return `${prefix}${trimmed}`;
  return `${prefix}/${trimmed}`;
}

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

export default function Footer({ locale, settings }: Props) {
  const isEn = locale === "en";
  const year = new Date().getFullYear();
  const prefix = isEn ? "/en" : "/zh-TW";

  const homepageAnchorLinks: FooterLink[] = settings.quickLinks
    .filter((link) => link.label.trim() && link.href.trim() && !isHiddenFrontendLink(link.href))
    .map((item) => ({
      href: normalizeHomeHref(prefix, item.href),
      label: isEn ? (item.labelEn?.trim() ? item.labelEn : item.label) : item.label,
    }));

  const exploreLinks: FooterLink[] = [
    { href: `${prefix}/`, label: isEn ? "Home" : "首頁" },
    ...homepageAnchorLinks,
  ];

  const { facebookPageUrl, youtubeChannelUrl, instagramUrl, lineUrl } = settings.socialLinks;

  const communityLinks: FooterLink[] = [
    { href: `${prefix}/about`, label: isEn ? "About" : "關於我們" },
  ];

  if (facebookPageUrl?.trim()) {
    communityLinks.push({
      href: facebookPageUrl.trim(),
      label: "Facebook",
      external: true,
    });
  }
  if (youtubeChannelUrl?.trim()) {
    communityLinks.push({
      href: youtubeChannelUrl.trim(),
      label: "YouTube",
      external: true,
    });
  }
  if (instagramUrl?.trim()) {
    communityLinks.push({
      href: instagramUrl.trim(),
      label: "Instagram",
      external: true,
    });
  }
  if (lineUrl?.trim()) {
    communityLinks.push({
      href: lineUrl.trim(),
      label: isEn ? "LINE Official Account" : "LINE 官方帳號",
      external: true,
    });
  }

  const sitemapGroups = [
    {
      title: isEn ? "Explore" : "探索內容",
      links: exploreLinks,
    },
    {
      title: isEn ? "Community" : "社群",
      links: communityLinks,
    },
    {
      title: isEn ? "Technical" : "技術導覽",
      links: [{ href: "/sitemap.xml", label: "Sitemap XML" }],
    },
  ];

  return (
    <footer className="border-t border-blue-900/40 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-lg font-bold">{isEn ? "Zenith Mind" : "巔峰思維"}</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-gray-300">
              {isEn
                ? "A modern knowledge media platform for AI, investing, SEO and personal brand growth."
                : "以 AI、投資理財、SEO 與個人品牌成長為核心的現代知識媒體平台。"}
            </p>
          </div>

          <nav
            aria-label={isEn ? "Full site navigation" : "全站導覽"}
            className="grid gap-8 sm:grid-cols-3"
          >
            {sitemapGroups.map((group) => (
              <section key={group.title}>
                <h2 className="text-sm font-semibold text-white">{group.title}</h2>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.href}-${link.label}`}>
                      <a
                        href={link.href}
                        {...(link.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="inline-flex rounded-sm hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 border-t border-white/10 pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-gray-300">
          © {year} {isEn ? "Zenith Mind" : "巔峰思維"}．
          {isEn ? "All rights reserved." : "保留所有權利。"}
        </p>
        <p className="text-xs uppercase tracking-[0.18em] text-blue-200/80">
          SEO / GEO / SGO Ready
        </p>
      </div>
    </footer>
  );
}
