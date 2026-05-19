"use client";

import { useEffect, useState } from "react";
import { HOMEPAGE_VIEW_RECORDED } from "@/lib/analytics/homepage-view-event";

interface Props {
  initial: number;
}

export default function SocialProofViewCount({ initial }: Props) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    setCount(initial);
  }, [initial]);

  useEffect(() => {
    function bump() {
      setCount((c) => c + 1);
    }
    window.addEventListener(HOMEPAGE_VIEW_RECORDED, bump);
    return () => window.removeEventListener(HOMEPAGE_VIEW_RECORDED, bump);
  }, []);

  return (
    <p className="min-h-9 text-3xl font-bold tabular-nums text-gray-950">
      {count.toLocaleString()}
    </p>
  );
}
