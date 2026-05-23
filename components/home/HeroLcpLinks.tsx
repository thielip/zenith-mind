import { getHeroDeliverySources } from "@/lib/images/hero-delivery";

interface Props {
  imageUrl: string;
}

/** RSC：preload 會由 Next 提升到 document head，早於 client hydration */
export function HeroLcpLinks({ imageUrl }: Props) {
  const { src, srcSet, sizes } = getHeroDeliverySources(imageUrl);
  return (
    <link
      rel="preload"
      as="image"
      href={src}
      imageSrcSet={srcSet || undefined}
      imageSizes={sizes}
      fetchPriority="high"
    />
  );
}
