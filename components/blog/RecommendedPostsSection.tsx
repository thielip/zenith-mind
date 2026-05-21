import { Suspense } from "react";
import RecommendedPosts from "@/components/blog/RecommendedPosts";

interface Props {
  currentPostId: string;
  categoryId?: string;
  locale: string;
}

function RecommendedFallback() {
  return (
    <section className="mt-16 border-t pt-10" aria-hidden="true">
      <div className="mb-6 h-7 w-32 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    </section>
  );
}

export default function RecommendedPostsSection(props: Props) {
  return (
    <Suspense fallback={<RecommendedFallback />}>
      <RecommendedPosts {...props} />
    </Suspense>
  );
}
