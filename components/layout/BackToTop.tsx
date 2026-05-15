"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  locale: string;
}

export default function BackToTop({ locale }: Props) {
  const isEn = locale === "en";
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsVisible(window.scrollY > 480);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={[
        "fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-950/25 transition",
        "hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      ].join(" ")}
      aria-label={isEn ? "Back to top" : "回到頁首"}
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}
