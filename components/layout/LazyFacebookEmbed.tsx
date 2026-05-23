"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  pageUrl: string;
}

export default function LazyFacebookEmbed({ pageUrl }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "240px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="min-h-[180px] w-full">
      {show ? (
        <iframe
          title="Facebook Page"
          src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
            pageUrl
          )}&tabs=timeline&width=260&height=180&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`}
          width="260"
          height="180"
          className="w-full rounded-xl border-0"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        />
      ) : null}
    </div>
  );
}
