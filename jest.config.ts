import nextJest from "next/jest.js";
import type { Config } from "jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  clearMocks: true,
  coverageProvider: "v8",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/env$": "<rootDir>/test-utils/env-mock.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "<rootDir>/**/__tests__/**/*.test.ts",
    "<rootDir>/**/__tests__/**/*.test.tsx",
  ],
  collectCoverageFrom: [
    "app/api/auth/refresh/route.ts",
    "app/api/webhook/route.ts",
    "app/api/revalidate/route.ts",
    "app/api/ai/jobs/route.ts",
    "app/api/ai/jobs/[id]/route.ts",
    "app/api/cron/cleanup/route.ts",
    "app/(public)/go/**/*.{ts,tsx}",
    "actions/affiliate.actions.ts",
    "actions/media.actions.ts",
    "actions/totp-activate.actions.ts",
    "lib/auth/jwt.ts",
    "lib/middleware/auth-guard.ts",
    "lib/auth/admin-route-policy.ts",
    "!**/*.d.ts",
    "!**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};

export default createJestConfig(config);
