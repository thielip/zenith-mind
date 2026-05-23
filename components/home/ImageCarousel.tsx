"use client";

import Link from "next/link";
import ResponsiveImage from "@/components/ui/ResponsiveImage";
import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { HomeCarouselItemData, HomepageCopy } from "@/lib/site/types";
import { EXTERNAL_LINK_REL, isExternalHttpUrl } from "@/lib/site/external-link";

interface Props {
  locale: string;
  items: HomeCarouselItemData[];
  /** 自動橫向捲動間隔（秒）；0 = 關閉 */
  autoplaySeconds?: number;
  copy: HomepageCopy["visualCarousel"];
}

export default function ImageCarousel({ locale, items, autoplaySeconds = 0, copy }: Props) {
  const isEn = locale === "en";
  const scrollRef = useRef<HTMLDivElement>(null);
  const maxScrollRef = useRef(0);
  const activeItems = useMemo(() => items.filter((item) => item.isActive && item.imageUrl), [items]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const measure = () => {
      maxScrollRef.current = Math.max(0, node.scrollWidth - node.clientWidth - 2);
    };

    measure();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [activeItems.length]);

  useEffect(() => {
    if (autoplaySeconds <= 0 || activeItems.length <= 1) return;
    const delta = 340;
    const id = window.setInterval(() => {
      const node = scrollRef.current;
      if (!node) return;
      const maxScroll = maxScrollRef.current;
      if (node.scrollLeft >= maxScroll) {
        node.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        node.scrollBy({ left: delta, behavior: "smooth" });
      }
    }, autoplaySeconds * 1000);
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
          rel={EXTERNAL_LINK_REL}
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
          {activeItems.map((item) => {
            const card = (
              <article
                data-carousel-card
                className="group relative h-80 w-72 shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/20 transition hover:-translate-y-1 sm:w-80"
              >
                <ResponsiveImage
                  src={item.imageUrl}
                  alt={item.imageAlt || item.title}
                  fill
                  responsiveWidths={[256, 288, 320]}
                  sizes="(max-width: 640px) 18rem, 320px"
                  quality={50}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
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
