"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { HomeCarouselItemData, HomepageCopy } from "@/lib/site/types";

interface Props {
  locale: string;
  items: HomeCarouselItemData[];
  /** 自動橫向捲動間隔（秒）；0 = 關閉 */
  autoplaySeconds?: number;
  copy: HomepageCopy["visualCarousel"];
}

function isExternalHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

export default function ImageCarousel({ locale, items, autoplaySeconds = 0, copy }: Props) {
  const isEn = locale === "en";
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeItems = useMemo(() => items.filter((item) => item.isActive && item.imageUrl), [items]);

  useEffect(() => {
    if (autoplaySeconds <= 0 || activeItems.length <= 1) return;
    const el = scrollRef.current;
    if (!el) return;
    const step = () => {
      const card = el.querySelector<HTMLElement>("[data-carousel-card]");
      const delta = (card?.offsetWidth ?? 320) + 20;
      const maxScroll = el.scrollWidth - el.clientWidth - 2;
      if (el.scrollLeft >= maxScroll) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: delta, behavior: "smooth" });
      }
    };
    const id = window.setInterval(step, autoplaySeconds * 1000);
    return () => window.clearInterval(id);
  }, [autoplaySeconds, activeItems.length]);

  if (activeItems.length === 0) return null;

  function wrapCard(item: HomeCarouselItemData, card: ReactNode) {
    const href = item.href?.trim() ?? "";
    if (!href) {
      return <div key={item.id}>{card}</div>;
    }
    if (isExternalHttpUrl(href)) {
      return (
        <a
          key={item.id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          {card}
        </a>
      );
    }
    return (
      <Link
        key={item.id}
        href={href}
        className="shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
      >
        {card}
      </Link>
    );
  }

  return (
    <section
      id="visual-stories"
      className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 py-16 text-white"
      aria-labelledby="visual-stories-title"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              {isEn ? copy.eyebrowEn : copy.eyebrow}
            </p>
            <h2 id="visual-stories-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {isEn ? copy.titleEn : copy.title}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-blue-100/80">
            {isEn ? copy.descriptionEn : copy.description}
          </p>
        </div>

        <div
          ref={scrollRef}
          className="mt-8 flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]"
        >
          {activeItems.map((item, itemIndex) => {
            const isLcpCandidate = itemIndex === 0;
            const card = (
              <article
                data-carousel-card
                className="group relative h-80 w-72 shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/20 transition hover:-translate-y-1 sm:w-80"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.imageAlt || item.title}
                  fill
                  unoptimized={item.imageUrl.endsWith(".svg")}
                  sizes="(max-width: 640px) 18rem, (max-width: 1024px) 20rem, 320px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={isLcpCandidate}
                  fetchPriority={isLcpCandidate ? "high" : "auto"}
                  loading={isLcpCandidate ? undefined : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-blue-950/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-200">{item.description}</p>
                  )}
                </div>
              </article>
            );
            return wrapCard(item, card);
          })}
        </div>
      </div>
    </section>
  );
}
