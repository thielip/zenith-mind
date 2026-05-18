// Google Search Console HTML file verification（避免 .html 被 307 剝除）
export const dynamic = "force-static";

export function GET(): Response {
  return new Response("google-site-verification: google0276434467af2dd0.html", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
