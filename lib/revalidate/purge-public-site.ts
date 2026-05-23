/**
 * Vercel 後台更新內容後，同步觸發公開站（Cloudflare Worker）的 on-demand revalidate。
 */
export async function purgePublicSiteCache(input: {
  type: "path" | "tag";
  value: string;
}): Promise<void> {
  const secret = process.env["REVALIDATE_SECRET"]?.trim();
  if (!secret) {
    console.error("[purge-public-site] missing REVALIDATE_SECRET");
    return;
  }

  const targets = [
    process.env["NEXT_PUBLIC_SITE_URL"]?.replace(/\/$/, ""),
    process.env["PUBLIC_SITE_URL"]?.replace(/\/$/, ""),
    "https://www.getzenithmind.com",
  ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);

  await Promise.all(
    targets.map(async (base) => {
      try {
        const res = await fetch(`${base}/api/revalidate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
          cache: "no-store",
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error(
            `[purge-public-site] ${base} failed: ${res.status} ${text.slice(0, 120)}`
          );
        }
      } catch (error) {
        console.error(`[purge-public-site] ${base} error`, error);
      }
    })
  );
}

export async function purgePublicSiteAfterPostChange(slug: string): Promise<void> {
  await Promise.all([
    purgePublicSiteCache({ type: "tag", value: "posts" }),
    purgePublicSiteCache({ type: "tag", value: "blog" }),
    purgePublicSiteCache({ type: "tag", value: "page-view-stats" }),
    purgePublicSiteCache({ type: "path", value: `/zh-TW/blog/${slug}` }),
    purgePublicSiteCache({ type: "path", value: `/en/blog/${slug}` }),
    purgePublicSiteCache({ type: "path", value: "/zh-TW/blog" }),
    purgePublicSiteCache({ type: "path", value: "/en/blog" }),
  ]);
}
