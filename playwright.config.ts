import path from "node:path";
import { config } from "dotenv";
import { defineConfig, devices } from "playwright/test";

config({ path: ".env.local" });

const adminAuthFile = path.join("playwright", ".auth", "admin.json");

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "admin-setup",
      testMatch: /admin\/auth\.setup\.ts/,
      timeout: 120_000,
    },
    {
      name: "admin",
      testMatch: /admin\/.*\.spec\.ts/,
      dependencies: ["admin-setup"],
      timeout: 90_000,
      expect: { timeout: 10_000 },
      use: {
        ...devices["Desktop Chrome"],
        storageState: adminAuthFile,
      },
    },
    {
      name: "chromium",
      testIgnore: /tests\/admin\//,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env["PLAYWRIGHT_SKIP_WEBSERVER"]
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
