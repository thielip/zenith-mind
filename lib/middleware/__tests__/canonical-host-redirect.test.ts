import { NextRequest } from "next/server";
import { canonicalHostRedirect } from "@/lib/middleware/canonical-host-redirect";

describe("canonicalHostRedirect", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    Object.assign(process.env, {
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://www.getzenithmind.com",
      ADMIN_DEPLOYMENT_URL: "https://zenith-mind.vercel.app",
    });
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it("301 public paths on vercel.app to www", () => {
    const req = new NextRequest("https://zenith-mind.vercel.app/zh-TW/blog");
    const res = canonicalHostRedirect(req);
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe(
      "https://www.getzenithmind.com/zh-TW/blog"
    );
  });

  it("does not redirect admin on vercel.app (avoid CF loop)", () => {
    const req = new NextRequest(
      "https://zenith-mind.vercel.app/admin/dashboard"
    );
    expect(canonicalHostRedirect(req)).toBeNull();
  });

  it("does not redirect www host", () => {
    const req = new NextRequest("https://www.getzenithmind.com/zh-TW");
    expect(canonicalHostRedirect(req)).toBeNull();
  });
});
