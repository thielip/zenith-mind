/**
 * Explicit favicon route to prevent platform-level 500 fallback.
 * Returning 204 is valid for favicon requests and avoids unnecessary payload.
 * nodejs runtime: OpenNext (Cloudflare) 不支援與 default bundle 混用的 edge route。
 */
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

