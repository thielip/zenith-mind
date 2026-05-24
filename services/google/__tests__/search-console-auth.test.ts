import {
  getSearchConsoleAuthMode,
  getSearchConsoleOAuthCredentials,
} from "../auth";

describe("Search Console OAuth credentials", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.GSC_OAUTH_CLIENT_ID;
    delete process.env.GSC_OAUTH_CLIENT_SECRET;
    delete process.env.GSC_OAUTH_REFRESH_TOKEN;
    delete process.env.GOOGLE_ADS_CLIENT_ID;
    delete process.env.GOOGLE_ADS_CLIENT_SECRET;
    delete process.env.GOOGLE_ADS_REFRESH_TOKEN;
    delete process.env.GA4_CLIENT_EMAIL;
    delete process.env.GA4_PRIVATE_KEY;
  });

  afterAll(() => {
    process.env = env;
  });

  it("uses GSC_OAUTH_* when set", () => {
    process.env.GSC_OAUTH_CLIENT_ID = "gsc-id";
    process.env.GSC_OAUTH_CLIENT_SECRET = "gsc-secret";
    process.env.GSC_OAUTH_REFRESH_TOKEN = "gsc-rt";
    expect(getSearchConsoleOAuthCredentials()).toEqual({
      clientId: "gsc-id",
      clientSecret: "gsc-secret",
      refreshToken: "gsc-rt",
    });
    expect(getSearchConsoleAuthMode()).toBe("oauth");
  });

  it("falls back to GOOGLE_ADS_* when GSC secret missing", () => {
    process.env.GSC_OAUTH_REFRESH_TOKEN = "shared-rt";
    process.env.GOOGLE_ADS_CLIENT_ID = "ads-id";
    process.env.GOOGLE_ADS_CLIENT_SECRET = "ads-secret";
    expect(getSearchConsoleOAuthCredentials()).toEqual({
      clientId: "ads-id",
      clientSecret: "ads-secret",
      refreshToken: "shared-rt",
    });
  });
});
