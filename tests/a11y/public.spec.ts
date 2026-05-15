import { expect, test, type Page } from "playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoCriticalA11yViolations(pageUrl: string, page: Page) {
  await page.goto(pageUrl);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude("iframe")
    .analyze();

  const serious = results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact ?? "")
  );
  expect(serious).toEqual([]);
}

test.describe("public accessibility", () => {
  test("homepage has no serious WCAG violations", async ({ page }) => {
    await expectNoCriticalA11yViolations("/zh-TW", page);
  });

  test("blog list has no serious WCAG violations", async ({ page }) => {
    await expectNoCriticalA11yViolations("/zh-TW/blog", page);
  });

  test("admin login has no serious WCAG violations", async ({ page }) => {
    await expectNoCriticalA11yViolations("/admin/login", page);
  });
});
