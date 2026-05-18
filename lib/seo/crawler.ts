/** 常見搜尋引擎／預覽 Bot User-Agent（簡易判斷） */
const CRAWLER_RE =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|slackbot|discordbot|applebot|semrushbot|ahrefsbot|petalbot|bytespider/i;

export function isSearchEngineCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return CRAWLER_RE.test(userAgent);
}
