import { mkdirSync } from "node:fs";
import path from "node:path";
import { test as setup, expect } from "playwright/test";

const ADMIN_EMAIL = process.env["ADMIN_BOOTSTRAP_EMAIL"] ?? "thielip@gmail.com";
const ADMIN_PASSWORD = process.env["ADMIN_BOOTSTRAP_PASSWORD"] ?? "";
const authFile = path.join(process.cwd(), "playwright", ".auth", "admin.json");

setup("authenticate admin", async ({ page }) => {
  setup.skip(!ADMIN_PASSWORD, "需設定 ADMIN_BOOTSTRAP_PASSWORD（.env.local）");

  mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/admin/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /登入|Sign in/i }).click();

  await expect(page).toHaveURL(/\/admin\/(dashboard|totp)(\/|$)/, { timeout: 60_000 });
  setup.skip(
    /\/admin\/totp/.test(page.url()),
    "帳號需 TOTP；測試請使用未啟用 2FA 的 bootstrap 帳號"
  );
  await expect(page.locator("#admin-main")).toBeVisible({ timeout: 60_000 });

  await page.context().storageState({ path: authFile });
});
