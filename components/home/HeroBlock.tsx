import type { HeroSlideData } from "@/lib/site/types";
import { HeroFirstSlideImage } from "@/components/home/HeroFirstSlideImage";
import { HeroLcpLinks } from "@/components/home/HeroLcpLinks";
import HeroSlider from "@/components/home/HeroSlider";

interface Props {
  slides: HeroSlideData[];
  locale: string;
  autoplaySeconds?: number;
}

export default function HeroBlock({ slides, locale, autoplaySeconds = 0 }: Props) {
  const activeSlides = slides.filter((slide) => slide.isActive && slide.imageUrl);
  const firstSlide = activeSlides[0];
  const serverLcpPainted = Boolean(firstSlide?.imageUrl);

  return (
    <>
      {serverLcpPainted && firstSlide ? (
        <HeroLcpLinks imageUrl={firstSlide.imageUrl} />
      ) : null}
      <section className="relative h-[560px] max-h-[90svh] overflow-hidden bg-neutral-200 text-white">
        {serverLcpPainted && firstSlide ? (
          <HeroFirstSlideImage
            imageUrl={firstSlide.imageUrl}
            alt={firstSlide.imageAlt || firstSlide.title}
          />
        ) : null}
        <HeroSlider
          locale={locale}
          slides={slides}
          autoplaySeconds={autoplaySeconds}
          serverLcpPainted={serverLcpPainted}
        />
      </section>
    </>
  );
}
