import { probeSearchConsoleRest } from "../search-console-probe";

const env = process.env;

describe("probeSearchConsoleRest", () => {
  beforeEach(() => {
    process.env = { ...env };
    delete process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
    delete process.env.GSC_OAUTH_CLIENT_ID;
    delete process.env.GSC_OAUTH_CLIENT_SECRET;
    delete process.env.GSC_OAUTH_REFRESH_TOKEN;
    delete process.env.GOOGLE_ADS_CLIENT_ID;
    delete process.env.GOOGLE_ADS_CLIENT_SECRET;
    delete process.env.GOOGLE_ADS_REFRESH_TOKEN;
    delete process.env.GA4_CLIENT_EMAIL;
    delete process.env.GA4_PRIVATE_KEY;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = env;
  });

  it("returns missing when site URL unset", async () => {
    const r = await probeSearchConsoleRest();
    expect(r.ok).toBe(false);
    expect(r.message).toContain("GOOGLE_SEARCH_CONSOLE_SITE_URL");
  });

  it("returns missing when auth unset", async () => {
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = "https://www.example.com/";
    const r = await probeSearchConsoleRest();
    expect(r.ok).toBe(false);
    expect(r.message).toContain("GSC 認證");
  });

  it("probes via OAuth refresh + sites.get REST", async () => {
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = "https://www.example.com/";
    process.env.GSC_OAUTH_CLIENT_ID = "client-id";
    process.env.GSC_OAUTH_CLIENT_SECRET = "client-secret";
    process.env.GSC_OAUTH_REFRESH_TOKEN = "refresh-token";

    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url === "https://oauth2.googleapis.com/token") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: "access-token" }),
        };
      }
      if (url.includes("webmasters/v3/sites/")) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ permissionLevel: "siteFullUser" }),
        };
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const r = await probeSearchConsoleRest();
    expect(r.ok).toBe(true);
    expect(r.message).toContain("siteFullUser");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("surfaces OAuth token errors", async () => {
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = "https://www.example.com/";
    process.env.GSC_OAUTH_CLIENT_ID = "client-id";
    process.env.GSC_OAUTH_CLIENT_SECRET = "client-secret";
    process.env.GSC_OAUTH_REFRESH_TOKEN = "bad-token";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "invalid_grant",
        error_description: "Token has been expired or revoked.",
      }),
    });

    const r = await probeSearchConsoleRest();
    expect(r.ok).toBe(false);
    expect(r.message).toContain("expired or revoked");
  });
});
