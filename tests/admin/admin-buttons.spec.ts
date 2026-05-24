import { test, expect, type Page } from "playwright/test";

const ADMIN_EMAIL = process.env["ADMIN_BOOTSTRAP_EMAIL"] ?? "thielip@gmail.com";
const ADMIN_PASSWORD = process.env["ADMIN_BOOTSTRAP_PASSWORD"] ?? "";

const ADMIN_PATHS = [
  "/admin/dashboard",
  "/admin/dashboard/seo",
  "/admin/dashboard/geo",
  "/admin/dashboard/aeo",
  "/admin/dashboard/traffic",
  "/admin/dashboard/business",
  "/admin/dashboard/content",
  "/admin/dashboard/realtime",
  "/admin/dashboard/agents",
  "/admin/dashboard/forecast",
  "/admin/site",
  "/admin/posts",
  "/admin/media",
  "/admin/affiliate",
  "/admin/dashboard/security",
  "/admin/dashboard/errors",
  "/admin/audit-log",
  "/admin/users",
  "/admin/dashboard/integrations",
  "/admin/settings",
];

const SKIP_BUTTON =
  /登出|刪除|停用|移除|清除|reset|delete|logout|disconnect|publish|發布|儲存|啟動連線/i;

async function adminLogin(page: Page) {
  test.skip(!ADMIN_PASSWORD, "需設定 ADMIN_BOOTSTRAP_PASSWORD");
  await page.goto("/admin/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /登入|Sign in/i }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?/, { timeout: 30_000 });
}

test.describe("Admin 後台按鈕與頁面", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  for (const path of ADMIN_PATHS) {
    test(`頁面可載入：${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(500);
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    });
  }

  test("戰情室無 url.parse 棄用錯誤", async ({ page }) => {
    const warnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        warnings.push(msg.text());
      }
    });
    await page.goto("/admin/dashboard");
    await page.waitForTimeout(3000);
    const dep = warnings.filter((w) => w.includes("url.parse") || w.includes("DEP0169"));
    expect(dep, dep.join("\n")).toHaveLength(0);
  });

  test("各頁可點擊按鈕不導致崩潰", async ({ page }) => {
    test.setTimeout(180_000);
    for (const path of ADMIN_PATHS) {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");

      const allButtons = page.locator("button:visible");
      const count = Math.min(await allButtons.count(), 20);
      for (let i = 0; i < count; i++) {
        const btn = allButtons.nth(i);
        const label = ((await btn.textContent()) ?? "").trim();
        if (!label || SKIP_BUTTON.test(label)) continue;
        if ((await btn.getAttribute("disabled")) !== null) continue;

        await btn.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(300);
        await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
      }
    }
  });

  test("整合中心：重新檢測按鈕", async ({ page }) => {
    await page.goto("/admin/dashboard/integrations");
    const probeBtn = page.getByRole("button", { name: /重新檢測|探測|檢測/i }).first();
    if (await probeBtn.isVisible().catch(() => false)) {
      await probeBtn.click();
      await page.waitForTimeout(2000);
      await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    }
  });
});
