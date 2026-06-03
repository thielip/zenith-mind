/**
 * P0–P3 安全防禦矩陣 — 獨立整合驗證
 *
 * npm run verify:security-matrix
 * npm run verify:security-matrix:deploy  （含本機 DB / env 待辦檢查）
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

process.env["SECURITY_MATRIX_QUIET"] = "1";

type TestResult = { name: string; passed: boolean; detail: string };
const results: TestResult[] = [];

function pass(name: string, detail: string): void {
  results.push({ name, passed: true, detail });
  console.log(`  ✓ ${name} — ${detail}`);
}

function fail(name: string, detail: string): void {
  results.push({ name, passed: false, detail });
  console.log(`  ✗ ${name} — ${detail}`);
}

function assert(cond: boolean, name: string, detail: string): void {
  if (cond) pass(name, detail);
  else fail(name, detail);
}

function loadEnvLocal(): void {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val.replace(/\\n/g, "\n");
  }
}

async function loadSecurityModules() {
  const { redis } = await import("../infrastructure/redis/client");
  const { checkRateLimit } = await import("../lib/security/rate-limit");
  const {
    resetMemoryRateLimitCounterStore,
    resetMemoryRateLimitStore,
  } = await import("../lib/security/rate-limit-memory");
  const {
    assertPostPasswordAttemptAllowed,
    delayAfterPostPasswordFailure,
  } = await import("../lib/security/post-password-guard");
  const { sanitizeRichTextEdge } = await import("../lib/sanitize/html-edge");

  return {
    redis,
    checkRateLimit,
    resetMemoryRateLimitCounterStore,
    resetMemoryRateLimitStore,
    assertPostPasswordAttemptAllowed,
    delayAfterPostPasswordFailure,
    sanitizeRichTextEdge,
  };
}

function forceRedisDown(redis: { incr: (...a: unknown[]) => Promise<number>; expire: (...a: unknown[]) => Promise<number> }): () => void {
  const origIncr = redis.incr.bind(redis);
  const origExpire = redis.expire.bind(redis);
  redis.incr = async () => {
    throw new Error("SIMULATED_REDIS_DOWN");
  };
  redis.expire = async () => {
    throw new Error("SIMULATED_REDIS_DOWN");
  };
  return () => {
    redis.incr = origIncr;
    redis.expire = origExpire;
  };
}

const ATTEMPT_LIMIT = 10;

async function testRedisFailClosedMemoryFallback(
  checkRateLimit: Awaited<ReturnType<typeof loadSecurityModules>>["checkRateLimit"],
  resetMemoryRateLimitStore: () => void,
  resetMemoryRateLimitCounterStore: () => void,
  redis: Awaited<ReturnType<typeof loadSecurityModules>>["redis"]
): Promise<void> {
  console.log("\n[1] Redis fail-closed → memory sliding window");

  const { checkMemoryRateLimit, resetMemoryRateLimitCounterStore: resetCnt } =
    await import("../lib/security/rate-limit-memory");
  resetMemoryRateLimitStore();
  resetCnt();
  const memKey = "matrix:memory-only";
  for (let i = 1; i <= ATTEMPT_LIMIT; i++) {
    const rl = checkMemoryRateLimit(memKey, ATTEMPT_LIMIT, 60_000);
    if (!rl.allowed) {
      fail("memory-allows-10", `memory blocked early at ${i}`);
      return;
    }
  }
  const memBlocked = checkMemoryRateLimit(memKey, ATTEMPT_LIMIT, 60_000);
  assert(memBlocked.backend === "memory", "memory-backend", "sliding window uses memory backend");
  assert(!memBlocked.allowed, "memory-fail-closed", "11th request blocked in memory store");

  void checkRateLimit;
  void redis;
  const jest = spawnSync(
    "npx",
    ["jest", "lib/security/__tests__/rate-limit.test.ts", "--runInBand", "--silent"],
    { cwd: process.cwd(), shell: true, encoding: "utf8" }
  );
  assert(
    jest.status === 0,
    "jest-redis-fallback",
    "checkRateLimit Redis mock → memory (not fail-open)"
  );
}

/** 模擬 verifyPostPasswordAction 限流段（不 sleep，快速驗 429） */
async function testPostPasswordRateLimit(
  assertPostPasswordAttemptAllowed: Awaited<
    ReturnType<typeof loadSecurityModules>
  >["assertPostPasswordAttemptAllowed"],
  resetMemoryRateLimitStore: () => void,
  resetMemoryRateLimitCounterStore: () => void,
  redis: Awaited<ReturnType<typeof loadSecurityModules>>["redis"]
): Promise<void> {
  console.log("\n[2a] Post password rate-limit (verifyPostPasswordAction path)");
  resetMemoryRateLimitStore();
  resetMemoryRateLimitCounterStore();
  const restore = forceRedisDown(redis);
  const runId = crypto.randomUUID().slice(0, 8);
  const slug = `matrix-protected-post-${runId}`;
  const ip = `203.0.113.${100 + (runId.charCodeAt(0) % 150)}`;
  const statuses: number[] = [];

  try {
    for (let i = 1; i <= 12; i++) {
      const attempt = await assertPostPasswordAttemptAllowed(slug, ip);
      statuses.push(attempt.allowed ? 401 : 429);
    }

    assert(statuses.slice(0, 10).every((s) => s === 401), "attempts-1-10-allowed", `1-10: ${statuses.slice(0, 10).join(",")}`);
    assert(statuses[10] === 429, "attempt-11-429", `11th=${statuses[10]}`);
    assert(statuses[11] === 429, "attempt-12-429", `12th=${statuses[11]}`);
    console.log(`      status sequence: ${statuses.join(" → ")}`);
  } finally {
    restore();
  }
}

/** 指數退避延遲（verifyPostPasswordAction 密碼錯誤路徑） */
async function testPostPasswordExponentialBackoff(
  delayAfterPostPasswordFailure: Awaited<
    ReturnType<typeof loadSecurityModules>
  >["delayAfterPostPasswordFailure"],
  resetMemoryRateLimitStore: () => void,
  resetMemoryRateLimitCounterStore: () => void,
  redis: Awaited<ReturnType<typeof loadSecurityModules>>["redis"]
): Promise<void> {
  console.log("\n[2b] Post password exponential backoff (failure delays)");
  resetMemoryRateLimitStore();
  resetMemoryRateLimitCounterStore();
  const restore = forceRedisDown(redis);
  const runId = crypto.randomUUID().slice(0, 8);
  const slug = `matrix-backoff-post-${runId}`;
  const ip = `203.0.114.${50 + (runId.charCodeAt(1) % 150)}`;
  const delays: number[] = [];

  try {
    for (let i = 0; i < 4; i++) {
      const t0 = Date.now();
      await delayAfterPostPasswordFailure(slug, ip);
      delays.push(Date.now() - t0);
    }

    assert(delays[1]! >= delays[0]!, "backoff-monotonic-2", `${delays[1]}ms >= ${delays[0]}ms`);
    assert(delays[2]! >= delays[1]!, "backoff-monotonic-3", `${delays[2]}ms >= ${delays[1]}ms`);
    assert(delays[3]! >= 700, "backoff-4th-min", `4th delay ${delays[3]}ms >= 700ms`);
    console.log(`      delays(ms): ${delays.join(", ")}`);
  } finally {
    restore();
  }
}

function testSanitizeRichTextEdge(
  sanitizeRichTextEdge: Awaited<ReturnType<typeof loadSecurityModules>>["sanitizeRichTextEdge"]
): void {
  console.log("\n[3] Edge XSS sanitizeRichTextEdge allowlist");

  const svgOut = sanitizeRichTextEdge(
    '<svg onload="alert(1)"><circle r="1"/></svg><p>ok</p>'
  );
  assert(!/<svg/i.test(svgOut), "strip-svg", "svg removed");
  assert(!/onload/i.test(svgOut), "strip-onload", "onload removed");
  assert(svgOut.includes("<p>ok</p>"), "keep-safe-p", "safe paragraph kept");

  const onclickOut = sanitizeRichTextEdge('<b onclick="evil()">safe</b>');
  assert(!/onclick/i.test(onclickOut), "strip-onclick", "onclick stripped");
  assert(onclickOut.includes("safe"), "keep-text", `text preserved: "${onclickOut}"`);

  const scriptOut = sanitizeRichTextEdge('<p>hi</p><script>alert(1)</script>');
  assert(!/<script/i.test(scriptOut), "strip-script", "script removed");
}

async function checkDeploymentTodos(): Promise<void> {
  console.log("\n[4] Deployment todo verification (local / repo)");

  const wrangler = readFileSync(join(process.cwd(), "wrangler.toml"), "utf8");
  assert(
    !/GUEST_BOOTSTRAP_PASSWORD/i.test(wrangler),
    "cf-wrangler-no-guest-secret",
    "wrangler.toml has no GUEST_BOOTSTRAP_PASSWORD"
  );

  const envLocalPath = join(process.cwd(), ".env.local");
  if (existsSync(envLocalPath)) {
    const local = readFileSync(envLocalPath, "utf8");
    const hasGuestPw = /^GUEST_BOOTSTRAP_PASSWORD\s*=\s*\S+/m.test(local);
    if (hasGuestPw) {
      fail("local-no-guest-password", ".env.local still sets GUEST_BOOTSTRAP_PASSWORD");
    } else {
      pass("local-no-guest-password", ".env.local has no GUEST_BOOTSTRAP_PASSWORD");
    }
  }

  if (!existsSync(envLocalPath)) {
    fail("db-guest-check", "no .env.local for DB check");
    return;
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const activeGuests = await prisma.user.findMany({
      where: { role: "GUEST", deletedAt: null },
      select: { email: true },
    });
    await prisma.$disconnect();

    if (activeGuests.length === 0) {
      pass("db-no-active-guest", "no active GUEST in DB (.env.local)");
    } else {
      fail(
        "db-no-active-guest",
        `${activeGuests.length} active GUEST: ${activeGuests.map((u) => u.email).join(", ")}`
      );
    }
  } catch (e: unknown) {
    fail("db-guest-check", e instanceof Error ? e.message : String(e));
  }

  console.log(
    "      ℹ Production Vercel DB/env: confirm in Dashboard (this script uses .env.local only)."
  );
}

async function main(): Promise<void> {
  const checkDeploy = process.argv.includes("--check-deploy");
  loadEnvLocal();

  console.log("═══════════════════════════════════════════════════════");
  console.log(" Zenith Mind — Security Matrix Verification");
  console.log("═══════════════════════════════════════════════════════");

  const mods = await loadSecurityModules();

  await testRedisFailClosedMemoryFallback(
    mods.checkRateLimit,
    mods.resetMemoryRateLimitStore,
    mods.resetMemoryRateLimitCounterStore,
    mods.redis
  );
  await testPostPasswordRateLimit(
    mods.assertPostPasswordAttemptAllowed,
    mods.resetMemoryRateLimitStore,
    mods.resetMemoryRateLimitCounterStore,
    mods.redis
  );
  await testPostPasswordExponentialBackoff(
    mods.delayAfterPostPasswordFailure,
    mods.resetMemoryRateLimitStore,
    mods.resetMemoryRateLimitCounterStore,
    mods.redis
  );
  testSanitizeRichTextEdge(mods.sanitizeRichTextEdge);

  if (checkDeploy) {
    await checkDeploymentTodos();
  } else {
    console.log("\n[4] Deployment checks skipped (npm run verify:security-matrix:deploy)");
  }

  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log(` Results: ${passed.length} passed, ${failed.length} failed`);
  console.log("═══════════════════════════════════════════════════════");

  if (failed.length > 0) {
    for (const f of failed) console.log(`  ✗ ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log("\nAll security matrix checks passed.");
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
