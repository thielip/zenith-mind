"use client";

import Link from "next/link";
import ResponsiveImage from "@/components/ui/ResponsiveImage";
import {
  HERO_FALLBACK_WIDTH,
  HERO_IMAGE_QUALITY,
  HERO_IMAGE_SIZES,
  HERO_IMAGE_WIDTHS,
  heroRenderHeightForWidth,
} from "@/lib/images/hero-presets";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { HeroSlideData } from "@/lib/site/types";
import { EXTERNAL_LINK_REL, isExternalHttpUrl } from "@/lib/site/external-link";

interface Props {
  slides: HeroSlideData[];
  locale: string;
  /** 自動切換間隔（秒）；0 或缺省則不自動 */
  autoplaySeconds?: number;
  /** 首圖已由 Server 繪製時，index=0 不重複載入 client 圖 */
  serverLcpPainted?: boolean;
}

export default function HeroSlider({
  slides,
  locale,
  autoplaySeconds = 0,
  serverLcpPainted = false,
}: Props) {
  const isEn = locale === "en";
  const [index, setIndex] = useState(0);
  const activeSlides = useMemo(
    () => slides.filter((slide) => slide.isActive && slide.imageUrl),
    [slides]
  );
  const slide = activeSlides[index] ?? activeSlides[0];

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  useEffect(() => {
    if (autoplaySeconds <= 0 || activeSlides.length <= 1) return;
    const ms = autoplaySeconds * 1000;
    const id = window.setInterval(() => {
      setIndex((c) => (c + 1) % activeSlides.length);
    }, ms);
    return () => window.clearInterval(id);
  }, [autoplaySeconds, activeSlides.length]);

  if (!slide) return null;

  function go(delta: number) {
    setIndex((current) => (current + delta + activeSlides.length) % activeSlides.length);
  }

  const imageHref = slide.imageHref?.trim() ?? "";
  const external = imageHref ? isExternalHttpUrl(imageHref) : false;
  const isFirstSlide = index === 0;
  const wrapImageWithLink = Boolean(imageHref) && !(isFirstSlide && external);
  const showClientImage = !serverLcpPainted || !isFirstSlide;

  const imageEl = showClientImage ? (
    <ResponsiveImage
      src={slide.imageUrl}
      alt={slide.imageAlt || slide.title}
      fill
      priority={isFirstSlide && !serverLcpPainted}
      fetchPriority={isFirstSlide && !serverLcpPainted ? "high" : "auto"}
      responsiveWidths={[...HERO_IMAGE_WIDTHS]}
      sizes={HERO_IMAGE_SIZES}
      quality={HERO_IMAGE_QUALITY}
      supabaseSrcSetOptions={{
        fallbackWidth: HERO_FALLBACK_WIDTH,
        heightForWidth: heroRenderHeightForWidth,
      }}
      className="object-cover"
    />
  ) : null;

  return (
    <>
      {showClientImage ? (
        <div className="absolute inset-0 z-[1]">
          {!wrapImageWithLink ? (
            imageEl
          ) : external ? (
            <a
              href={imageHref}
              target="_blank"
              rel={EXTERNAL_LINK_REL}
              className="absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              aria-label={isEn ? "Open hero image link" : "開啟大圖連結"}
            >
              {imageEl}
            </a>
          ) : (
            <Link
              href={imageHref}
              prefetch={false}
              className="absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              aria-label={isEn ? "Open hero image link" : "開啟大圖連結"}
            >
              {imageEl}
            </Link>
          )}
        </div>
      ) : null}

      <div
        className="pointer-events-auto absolute z-10 max-w-[min(38rem,calc(100%-2rem))] -translate-y-1/2 rounded-3xl border border-white/20 bg-neutral-950/90 px-5 py-6 text-white shadow-2xl shadow-black/50 ring-1 ring-black/25 backdrop-blur-sm sm:px-7 sm:py-8"
        style={{
          left: `${slide.textX}%`,
          top: `${slide.textY}%`,
        }}
      >
        <p className="mb-5 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-100 backdrop-blur">
          {isEn ? "Zenith Mind Featured" : "巔峰思維精選"}
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] sm:text-5xl lg:text-6xl">
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="mt-6 text-base leading-8 text-neutral-200 sm:text-lg">{slide.subtitle}</p>
        )}
        {slide.buttonLabel && slide.buttonHref && (
          <Link
            href={slide.buttonHref}
            className="mt-9 inline-flex rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 px-8 py-3.5 text-base font-bold text-gray-950 shadow-xl shadow-black/30 ring-2 ring-white/25 transition hover:brightness-105 hover:ring-white/40 focus:outline-none focus:ring-4 focus:ring-amber-300/60"
          >
            {slide.buttonLabel}
          </Link>
        )}
      </div>

      {activeSlides.length > 1 && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/20 bg-black/45 px-2 py-1.5 shadow-lg shadow-black/30 backdrop-blur-md">
          <button
            type="button"
            onClick={() => go(-1)}
            className="rounded-full p-2 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
            aria-label={isEn ? "Previous slide" : "上一張"}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <div className="flex gap-1.5">
            {activeSlides.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
                aria-label={`${isEn ? "Go to slide" : "切換到第"} ${itemIndex + 1}`}
                aria-current={itemIndex === index ? "true" : undefined}
              >
                <span
                  className={[
                    "block h-2 rounded-full transition-all",
                    itemIndex === index ? "w-8 bg-white" : "w-2 bg-white/50",
                  ].join(" ")}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="rounded-full p-2 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
            aria-label={isEn ? "Next slide" : "下一張"}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
