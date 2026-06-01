#!/usr/bin/env node
/**
 * Phase 3 架構死角盤點（本機執行，無需 DB）
 * 用法：npm run audit:architecture
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;

function fail(msg) {
  console.error(`[audit:architecture] FAIL ${msg}`);
  failed += 1;
}

function ok(msg) {
  console.log(`[audit:architecture] OK ${msg}`);
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

console.log("[audit:architecture] 1/3 Module Registry bundle isolation");
const registryIndex = read("server/command-center/registry/index.ts");
const registryManifest = read("server/command-center/registry/manifest.ts");
const registryLoaders = read("server/command-center/registry/module-loaders.ts");
const seoPage = read("app/admin/dashboard/seo/page.tsx");

if (/from ["']@\/server\/command-center\/modules\/[^"']+\/module["']/.test(registryIndex)) {
  fail("registry/index.ts statically imports a module implementation");
} else {
  ok("registry/index.ts has no static module imports");
}

if (!/import\s*\(/.test(registryLoaders)) {
  fail("module-loaders.ts missing dynamic import()");
} else {
  ok("module-loaders.ts uses dynamic import()");
}

if (/load-seo|search-console|googleapis/.test(registryManifest)) {
  fail("manifest.ts pulls heavy dependencies");
} else {
  ok("manifest.ts is lightweight");
}

if (/modules\/seo\/module/.test(seoPage)) {
  fail("seo page.tsx imports full module (should use meta.ts only)");
} else if (!/seoModuleMeta/.test(seoPage)) {
  fail("seo page.tsx should import seoModuleMeta for revalidate");
} else {
  ok("seo page.tsx imports only lightweight meta");
}

console.log("[audit:architecture] 1b/3 Registry Jest isolation");
const bundleTest = spawnSync(
  "npx",
  [
    "jest",
    "server/command-center/registry/__tests__/bundle-isolation.test.ts",
    "--silent",
  ],
  { cwd: root, shell: true, stdio: "inherit" }
);
if (bundleTest.status !== 0) {
  fail("registry bundle-isolation tests");
} else {
  ok("registry bundle-isolation tests passed");
}

console.log("[audit:architecture] 2/3 Outbox deep-merge unit tests");
const outboxTest = spawnSync(
  "npx",
  ["jest", "lib/events/__tests__/outbox-retry.test.ts", "--silent"],
  { cwd: root, shell: true, stdio: "inherit" }
);
if (outboxTest.status !== 0) {
  fail("outbox-retry tests");
} else {
  ok("outbox-retry deep clone tests passed");
}

console.log("[audit:architecture] 3/3 withRetry AbortSignal unit tests");
const retryTest = spawnSync(
  "npx",
  ["jest", "lib/http/__tests__/with-retry.test.ts", "--silent"],
  { cwd: root, shell: true, stdio: "inherit" }
);
if (retryTest.status !== 0) {
  fail("with-retry tests");
} else {
  ok("with-retry abort tests passed");
}

if (failed > 0) {
  console.error(`[audit:architecture] ${failed} check(s) failed`);
  process.exit(1);
}

console.log("[audit:architecture] All static + unit checks passed.");
