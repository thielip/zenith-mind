/**
 * 後台 E2E 冒煙測試
 *
 * 預期終端機可能出現 [WebServer] ⨯ [Error: aborted]：
 * - Playwright 快速換頁會中止 RSC / SSE（/api/admin/realtime/stream）
 * - 不影響測試通過，亦非使用者可見錯誤
 */
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
] as const;

const SKIP_BUTTON =
  /登出|刪除|停用|移除|清除|reset|delete|logout|disconnect|publish|發布|儲存|啟動連線|顯示密碼|隱藏密碼/i;

async function adminLogin(page: Page) {
  test.skip(!ADMIN_PASSWORD, "需設定 ADMIN_BOOTSTRAP_PASSWORD");
  await page.goto("/admin/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /登入|Sign in/i }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?/, { timeout: 30_000 });
}

async function assertHealthyPage(page: Page) {
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
  await expect(page.getByText("Internal Server Error")).toHaveCount(0);
}

test.describe("Admin 後台按鈕與頁面", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  for (const path of ADMIN_PATHS) {
    test(`頁面可載入：${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBeLessThan(500);
      await assertHealthyPage(page);
      // 作戰中心子頁常含圖表，稍候確保主內容已渲染
      if (path.startsWith("/admin/dashboard")) {
        await page.waitForTimeout(800);
      }
    });
  }

  test("戰情室無 url.parse 棄用錯誤", async ({ page }) => {
    const bad: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("url.parse") || text.includes("DEP0169")) {
        bad.push(text);
      }
    });
    await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
    await assertHealthyPage(page);
    expect(bad, bad.join("\n")).toHaveLength(0);
  });

  test("各頁可點擊按鈕不導致崩潰", async ({ page }) => {
    test.setTimeout(180_000);
    for (const path of ADMIN_PATHS) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const allButtons = page.locator("button:visible");
      const count = Math.min(await allButtons.count(), 20);
      for (let i = 0; i < count; i++) {
        const btn = allButtons.nth(i);
        const label = ((await btn.textContent()) ?? "").trim();
        if (!label || SKIP_BUTTON.test(label)) continue;
        if ((await btn.getAttribute("disabled")) !== null) continue;

        await btn.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(200);
        await assertHealthyPage(page);
      }
    }
  });

  test("串接設定：儲存草稿與啟動連線按鈕存在", async ({ page }) => {
    await page.goto("/admin/dashboard/integrations");
    await expect(page.getByRole("button", { name: "儲存草稿" })).toBeVisible();
    await expect(page.getByRole("button", { name: "啟動連線" })).toBeVisible();
    await expect(page.getByRole("button", { name: "停用" })).toBeVisible();
  });

  test("錯誤追蹤：重新檢測按鈕（若有異常項目）", async ({ page }) => {
    await page.goto("/admin/dashboard/errors");
    const probeBtn = page.getByRole("button", { name: "重新檢測" }).first();
    if (await probeBtn.isVisible().catch(() => false)) {
      await probeBtn.click();
      await page.waitForTimeout(3000);
      await assertHealthyPage(page);
    }
  });
});
