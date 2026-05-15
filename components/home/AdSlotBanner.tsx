// components/home/AdSlotBanner.tsx — Server Component
// 廣告位：資料庫帶寬高與 alt，降低 CLS；非 LCP 路徑可 lazy

import Image from "next/image";
import Link from "next/link";
import { getActiveAdSlot } from "@/lib/site/ad-slots";
import type { SiteLocale } from "@/lib/site/types";

interface Props {
  slotKey: string;
  locale: SiteLocale;
}

export default async function AdSlotBanner({ slotKey, locale }: Props) {
  const slot = await getActiveAdSlot(slotKey, locale);
  if (!slot) return null;

  const w = slot.imageWidth ?? 1200;
  const h = slot.imageHeight ?? 630;
  const ratioStyle = slot.aspectRatio
    ? {
        aspectRatio: slot.aspectRatio.includes(":")
          ? slot.aspectRatio.replace(":", " / ")
          : slot.aspectRatio.replace("/", " / "),
      }
    : undefined;

  const img = (
    <Image
      src={slot.imageUrl}
      alt={slot.imageAlt}
      width={w}
      height={h}
      className="h-auto w-full max-w-4xl rounded-xl object-cover"
      sizes="(max-width: 896px) 100vw, 896px"
      loading="lazy"
      style={ratioStyle}
    />
  );

  return (
    <section
      aria-label={slot.name}
      className="mx-auto max-w-5xl px-4 py-6"
    >
      {slot.href ? (
        <Link
          href={slot.href}
          className="block overflow-hidden rounded-xl ring-1 ring-gray-200/80 transition hover:ring-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rel="sponsored noopener noreferrer"
          target="_blank"
        >
          {img}
        </Link>
      ) : (
        <div className="overflow-hidden rounded-xl ring-1 ring-gray-200/80">{img}</div>
      )}
    </section>
  );
}
