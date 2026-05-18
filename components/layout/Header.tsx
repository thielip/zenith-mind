"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { SiteSettingsData } from "@/lib/site/types";
import { resolveSiteLogoSrc } from "@/lib/site/brand";

interface Props {
  locale: string;
  settings: SiteSettingsData;
}

export default function Header({ locale, settings }: Props) {
  const isEn   = locale === "en";
  const prefix = isEn ? "/en" : "/zh-TW";
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { href: `${prefix}/#topics`,     label: isEn ? "Topics" : "主題內容" },
    { href: `${prefix}/blog`,        label: isEn ? "Blog"   : "文章" },
    { href: `${prefix}/about`,       label: isEn ? "About"  : "關於" },
  ];
  const quickLinks = settings.quickLinks
    .filter((link) => !isHiddenFrontendLink(link.href))
    .map((link) => ({
      ...link,
      label: isEn ? (link.labelEn || link.label) : link.label,
      href: normalizeHref(link.href),
    }));

  function normalizeHref(href: string) {
    if (href.startsWith("http")) return href;
    if (href.startsWith("#")) return `${prefix}/${href}`;
    return href;
  }

  function isHiddenFrontendLink(href: string) {
    const normalized = href.toLowerCase();
    return normalized.includes("/admin") || normalized.includes("#newsletter");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      {quickLinks.length > 0 && (
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(115deg,transparent_35%,rgba(59,130,246,0.25)_50%,transparent_65%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(#334155_1px,transparent_1px),linear-gradient(90deg,#334155_1px,transparent_1px)] [background-size:12px_12px]"
          />
          <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 overflow-x-auto px-4 py-2 text-xs">
            <span className="shrink-0 font-semibold uppercase tracking-[0.18em] text-amber-200/95">
              {isEn ? "Quick Access" : "快速導覽"}
            </span>
            <ul className="flex shrink-0 items-center gap-3 sm:gap-4">
              {quickLinks.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <Link
                    href={link.href}
                    className="whitespace-nowrap text-gray-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-300/80 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <nav
        aria-label="主要導覽"
        className="mx-auto max-w-6xl px-4 py-3"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href={`${prefix}/`}
            className="group relative inline-flex items-center overflow-hidden rounded-2xl px-3 py-2.5 ring-1 ring-slate-200/80 transition hover:ring-blue-200/90 sm:px-4 sm:py-3"
            aria-label={isEn ? "Zenith Mind — Home" : "巔峰思維 — 回到首頁"}
            onClick={() => setIsOpen(false)}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/90 opacity-100 transition group-hover:opacity-100"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] [background-size:9px_9px]"
            />
            <span
              aria-hidden="true"
              className="absolute -right-6 -top-8 h-24 w-24 rotate-12 rounded-full border border-blue-100/80 bg-blue-50/50"
            />
            <span
              aria-hidden="true"
              className="absolute -bottom-10 -left-4 h-20 w-20 rounded-full border border-indigo-100/70 bg-indigo-50/40"
            />
            <Image
              src={resolveSiteLogoSrc(settings.logoUrl)}
              alt={settings.logoAlt || (isEn ? "Zenith Mind" : "巔峰思維")}
              width={168}
              height={48}
              sizes="(max-width: 640px) 132px, 168px"
              className="relative z-[1] h-8 w-auto max-w-[132px] object-contain sm:h-10 sm:max-w-[168px]"
              priority
              fetchPriority="high"
            />
          </Link>

          {/* 手機選單按鈕 */}
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 sm:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isOpen ? "關閉導覽選單" : "開啟導覽選單"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {/* 桌面導覽 */}
        <ul className="hidden items-center justify-end gap-6 text-sm sm:flex">
          {navItems.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {label}
              </Link>
            </li>
          ))}
          {/* 語言切換 */}
          <li>
            <Link
              href={isEn ? "/zh-TW" : "/en"}
              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isEn ? "切換至繁體中文" : "Switch to English"}
            >
              {isEn ? "繁中" : "EN"}
            </Link>
          </li>
        </ul>

        <div
          id="mobile-navigation"
          className={[
            "sm:hidden",
            isOpen ? "mt-3 block border-t border-gray-100 pt-3" : "hidden",
          ].join(" ")}
        >
          <ul className="space-y-1 text-sm">
            {navItems.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={isEn ? "/zh-TW" : "/en"}
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isEn ? "繁中" : "EN"}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
