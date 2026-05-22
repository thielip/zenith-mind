import { PUBLIC_ZH_TW_HOME_URL } from "@/lib/site/url";

describe("PUBLIC_ZH_TW_HOME_URL", () => {
  it("is the production zh-TW homepage for admin header", () => {
    expect(PUBLIC_ZH_TW_HOME_URL).toBe("https://www.getzenithmind.com/zh-TW");
  });
});
