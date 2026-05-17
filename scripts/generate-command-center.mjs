import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const routes = [
  { slug: "seo", loader: "loadSeoPayload", view: "SeoPageView", feature: "seo-intelligence" },
  { slug: "geo", loader: "loadGeoPayload", view: "GeoPageView", feature: "geo-intelligence" },
  { slug: "aeo", loader: "loadAeoPayload", view: "AeoPageView", feature: "aeo-intelligence" },
  { slug: "agents", loader: "loadAgentPayload", view: "AgentsPageView", feature: "agent-center" },
  { slug: "realtime", loader: "loadRealtimePayload", view: "RealtimePageView", feature: "realtime-monitoring" },
  { slug: "business", loader: "loadBusinessPayload", view: "BusinessPageView", feature: "business-analytics" },
  { slug: "traffic", loader: "loadTrafficPayload", view: "TrafficPageView", feature: "traffic-intelligence" },
  { slug: "content", loader: "loadContentPayload", view: "ContentPageView", feature: "content-intelligence" },
  { slug: "errors", loader: "loadErrorsPayload", view: "ErrorsPageView", feature: "error-intelligence" },
  { slug: "security", loader: "loadSecurityPayload", view: "SecurityPageView", feature: "security-center" },
  { slug: "forecast", loader: "loadForecastPayload", view: "ForecastPageView", feature: "forecast-center" },
];

for (const r of routes) {
  const pageDir = path.join(root, "app/admin/dashboard", r.slug);
  fs.mkdirSync(pageDir, { recursive: true });
  const page = `import { ${r.loader} } from "@/server/command-center/${r.loader.replace("Payload", "").replace("load", "load-").toLowerCase()}";
import { ${r.view} } from "@/features/${r.feature}/components/${r.slug}-page-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await ${r.loader}();
  return <${r.view} data={data} />;
}
`;
  // fix import path for loaders
  const loaderFile = r.loader
    .replace("loadSeoPayload", "load-seo")
    .replace("loadGeoPayload", "load-geo")
    .replace("loadAeoPayload", "load-aeo")
    .replace("loadAgentPayload", "load-agents")
    .replace("loadRealtimePayload", "load-realtime")
    .replace("loadBusinessPayload", "load-business")
    .replace("loadTrafficPayload", "load-traffic")
    .replace("loadContentPayload", "load-content")
    .replace("loadErrorsPayload", "load-errors")
    .replace("loadSecurityPayload", "load-security")
    .replace("loadForecastPayload", "load-forecast");

  const fixedPage = `import { ${r.loader} } from "@/server/command-center/${loaderFile}";
import { ${r.view} } from "@/features/${r.feature}/components/${r.slug}-page-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await ${r.loader}();
  return <${r.view} data={data} />;
}
`;
  fs.writeFileSync(path.join(pageDir, "page.tsx"), fixedPage);
}

console.log("Generated", routes.length, "dashboard routes");
