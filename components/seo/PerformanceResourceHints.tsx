import { env } from "@/env";

/** LCP 圖來自 Supabase Storage 時，提早建立連線 */
export default function PerformanceResourceHints() {
  const supabase = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabase) return null;

  return (
    <>
      <link rel="dns-prefetch" href={supabase} />
      <link rel="preconnect" href={supabase} crossOrigin="anonymous" />
    </>
  );
}
