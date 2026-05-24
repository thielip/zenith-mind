/**
 * 後台 E2E 冒煙測試
 *
 * 預期終端機可能出現 [WebServer] ⨯ [Error: aborted]：
 * - Playwright 快速換頁會中止 RSC / SSE（/api/admin/realtime/stream）
 * - 不影響測試通過，亦非使用者可見錯誤
 *
 * 登入狀態由 tests/admin/auth.setup.ts 寫入 playwright/.auth/admin.json（各測試共用）。
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

/** 按鈕冒煙略過即時串流與重型編輯器頁，縮短總執行時間 */
const SMOKE_BUTTON_PATHS = ADMIN_PATHS.filter(
  (p) => p !== "/admin/dashboard/realtime" && p !== "/admin/posts"
);

const SKIP_BUTTON =
  /登出|刪除|停用|移除|清除|reset|delete|logout|disconnect|publish|發布|儲存|啟動連線|顯示密碼|隱藏密碼/i;

const MAX_SMOKE_BUTTONS = 8;

async function adminLogin(page: Page) {
  test.skip(!ADMIN_PASSWORD, "需設定 ADMIN_BOOTSTRAP_PASSWORD");
  await page.goto("/admin/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /登入|Sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/(dashboard|totp)(\/|$)/, { timeout: 60_000 });
  if (/\/admin\/totp/.test(page.url())) {
    test.skip(true, "帳號需 TOTP；測試請使用未啟用 2FA 的 bootstrap 帳號");
    return;
  }
  await expect(page.locator("#admin-main")).toBeVisible({ timeout: 60_000 });
}

async function gotoAdminPath(page: Page, path: string) {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nav = () =>
    page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });

  try {
    await nav();
  } catch (err) {
    if (!String(err).includes("ERR_ABORTED")) throw err;
    await nav();
  }

  if (page.url().includes("/admin/login")) {
    await adminLogin(page);
    await nav();
  }

  await expect(page).toHaveURL(new RegExp(`${escaped}(\\?|$)`), { timeout: 15_000 });
}

async function assertHealthyPage(page: Page) {
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
  await expect(page.getByText("Internal Server Error")).toHaveCount(0);
}

test.describe("Admin 後台按鈕與頁面", () => {
  for (const path of ADMIN_PATHS) {
    test(`頁面可載入：${path}`, async ({ page }) => {
      await gotoAdminPath(page, path);
      await assertHealthyPage(page);
      await expect(page.locator("#admin-main")).toBeVisible();
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
    await gotoAdminPath(page, "/admin/dashboard");
    await page.waitForTimeout(2_000);
    await assertHealthyPage(page);
    expect(bad, bad.join("\n")).toHaveLength(0);
  });

  test("各頁可點擊按鈕不導致崩潰", async ({ page }) => {
    test.setTimeout(300_000);
    for (const path of SMOKE_BUTTON_PATHS) {
      await gotoAdminPath(page, path);
      const allButtons = page.locator("#admin-main button:visible");
      const count = Math.min(await allButtons.count(), MAX_SMOKE_BUTTONS);
      for (let i = 0; i < count; i++) {
        const btn = allButtons.nth(i);
        const label = ((await btn.textContent()) ?? "").trim();
        if (!label || SKIP_BUTTON.test(label)) continue;
        if ((await btn.getAttribute("disabled")) !== null) continue;

        await btn.click({ timeout: 5_000 }).catch(() => {});
        await page.waitForTimeout(150);
        await assertHealthyPage(page);
      }
    }
  });

  test("串接設定：儲存草稿與啟動連線按鈕存在", async ({ page }) => {
    await gotoAdminPath(page, "/admin/dashboard/integrations");
    await expect(page.getByRole("heading", { name: "外部串接設定" })).toBeVisible();
    await expect(page.getByRole("button", { name: "儲存草稿" })).toBeVisible();
    await expect(page.getByRole("button", { name: "啟動連線" })).toBeVisible();
    await expect(page.getByRole("button", { name: "停用" })).toBeVisible();
  });

  test("錯誤追蹤：重新檢測按鈕（若有異常項目）", async ({ page }) => {
    await gotoAdminPath(page, "/admin/dashboard/errors");
    const probeBtn = page.getByRole("button", { name: "重新檢測" }).first();
    if (await probeBtn.isVisible().catch(() => false)) {
      await probeBtn.click();
      await page.waitForTimeout(3_000);
      await assertHealthyPage(page);
    }
  });
});
