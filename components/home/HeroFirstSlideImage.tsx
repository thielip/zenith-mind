import { getHeroDeliverySources } from "@/lib/images/hero-delivery";

interface Props {
  imageUrl: string;
  alt: string;
}

/** Server 繪製首張 Hero，讓 LCP 不等 client bundle */
export function HeroFirstSlideImage({ imageUrl, alt }: Props) {
  const { src, srcSet, sizes } = getHeroDeliverySources(imageUrl);
  return (
    <div className="absolute inset-0 z-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- LCP：刻意走 delivery URL，不等 next/image client */}
      <img
        src={src}
        srcSet={srcSet || undefined}
        sizes={sizes}
        alt={alt}
        fetchPriority="high"
        decoding="sync"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
