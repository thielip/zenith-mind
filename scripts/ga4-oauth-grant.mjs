/**
 * 用【你自己的】OAuth Client 取得管理員 token，並將服務帳號加入 GA4。
 *
 * GCP → OAuth 用戶端 → 授權重新導向 URI：
 *   http://localhost:8765/callback
 *
 * 用法：
 *   npx tsx --env-file=.env.local scripts/ga4-oauth-grant.mjs
 *   npx tsx --env-file=.env.local scripts/ga4-oauth-grant.mjs --code=4/0xxxx
 */
import http from "node:http";
import { execSync } from "node:child_process";

const CLIENT_ID = process.env.GA4_OAUTH_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GA4_OAUTH_CLIENT_SECRET?.trim();
const REDIRECT_URI = "http://localhost:8765/callback";
const SCOPE = "https://www.googleapis.com/auth/analytics.manage.users";
const SA_EMAIL = process.env.GA4_CLIENT_EMAIL?.trim();
const PROPERTY_ID = process.env.GA4_PROPERTY_ID?.trim() ?? "536903218";
const ACCOUNT_ID = process.env.GA4_ACCOUNT_ID?.trim() ?? "394118928";

const codeArg = process.argv.find((a) => a.startsWith("--code="))?.slice(7);

if (!CLIENT_ID || !CLIENT_SECRET || !SA_EMAIL) {
  console.error(
    "缺少 GA4_OAUTH_CLIENT_ID / GA4_OAUTH_CLIENT_SECRET / GA4_CLIENT_EMAIL"
  );
  process.exit(1);
}

function openBrowser(url) {
  try {
    if (process.platform === "win32") {
      execSync(`start "" "${url}"`, { stdio: "ignore" });
    } else if (process.platform === "darwin") {
      execSync(`open "${url}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: "ignore" });
    }
  } catch {
    console.log("請手動開啟瀏覽器：", url);
  }
}

async function readResponse(res, step) {
  const text = await res.text();
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json") || text.trim().startsWith("{")) {
    try {
      return { ok: res.ok, status: res.status, json: JSON.parse(text), raw: text };
    } catch {
      /* fall through */
    }
  }
  return {
    ok: res.ok,
    status: res.status,
    json: null,
    raw: text,
    html: text.includes("<!DOCTYPE") || text.includes("<html"),
  };
}

async function exchangeCode(code) {
  console.log("\n[1/2] 交換 access token…");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const parsed = await readResponse(res, "Token");
  if (parsed.html || !parsed.json) {
    throw new Error(
      `Token 交換失敗（HTTP ${parsed.status}）\n${parsed.raw.slice(0, 300)}`
    );
  }
  if (!parsed.ok) {
    throw new Error(
      `Token 交換失敗: ${parsed.json.error} — ${parsed.json.error_description ?? ""}`
    );
  }
  console.log("[OK] 已取得 access token");
  return parsed.json.access_token;
}

/** 嘗試單一 API；失敗不拋錯，回傳是否成功 */
async function tryCreateBinding(token, url, body, label) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const parsed = await readResponse(res, label);

  if (parsed.html || (!parsed.json && !parsed.ok)) {
    console.warn(`[WARN] ${label} — HTTP ${parsed.status} 非 JSON（常見：v1beta 帳戶端點不存在，可忽略）`);
    return false;
  }

  if (parsed.ok) {
    console.log(`[OK] ${label}`);
    return true;
  }

  const msg = parsed.json?.error?.message ?? parsed.raw?.slice(0, 200) ?? "";
  if (/already exists|ALREADY_EXISTS|duplicate/i.test(msg)) {
    console.log(`[SKIP] ${label} — 已存在`);
    return true;
  }
  console.warn(`[WARN] ${label} (${parsed.status}): ${msg}`);
  return false;
}

async function grantAccess(token) {
  console.log("\n[2/2] 授予 GA4 檢視者權限（依序嘗試，任一成功即可）…\n");

  const attempts = [
    {
      label: `Property ${PROPERTY_ID} — userLinks (v1alpha，推薦)`,
      url: `https://analyticsadmin.googleapis.com/v1alpha/properties/${PROPERTY_ID}/userLinks`,
      body: { emailAddress: SA_EMAIL, directRoles: ["VIEWER"] },
    },
    {
      label: `Property ${PROPERTY_ID} — accessBindings (v1alpha)`,
      url: `https://analyticsadmin.googleapis.com/v1alpha/properties/${PROPERTY_ID}/accessBindings`,
      body: { user: SA_EMAIL, roles: ["predefinedRoles/viewer"] },
    },
    {
      label: `Property ${PROPERTY_ID} — accessBindings (v1beta)`,
      url: `https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}/accessBindings`,
      body: { user: SA_EMAIL, roles: ["predefinedRoles/viewer"] },
    },
    {
      label: `帳戶 ${ACCOUNT_ID} — accessBindings (v1alpha)`,
      url: `https://analyticsadmin.googleapis.com/v1alpha/accounts/${ACCOUNT_ID}/accessBindings`,
      body: { user: SA_EMAIL, roles: ["predefinedRoles/viewer"] },
    },
  ];

  let anyOk = false;
  for (const a of attempts) {
    const ok = await tryCreateBinding(token, a.url, a.body, a.label);
    anyOk = anyOk || ok;
    if (ok && a.label.includes("userLinks")) break;
  }

  if (!anyOk) {
    throw new Error(
      "所有授權方式皆未成功。請確認：\n" +
        "  1) 已啟用 Google Analytics Admin API\n" +
        "  2) 登入 Google 帳號為 GA4【管理員】\n" +
        "  3) Property ID 536903218、帳戶 ID 394118928 正確"
    );
  }
}

async function runWithCode(code) {
  const token = await exchangeCode(code);
  await grantAccess(token);
  console.log("\n完成。請驗證：");
  console.log("  npx tsx --env-file=.env.local scripts/check-integrations.mjs\n");
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("=== GA4 服務帳號授權（自有 OAuth Client）===\n");
console.log("Client ID 前綴:", CLIENT_ID.slice(0, 20) + "…");
console.log("服務帳號:", SA_EMAIL);
console.log("帳戶 ID:", ACCOUNT_ID, "| Property ID:", PROPERTY_ID);

if (codeArg) {
  runWithCode(codeArg).catch((e) => {
    console.error("\n[FAIL]", e.message);
    process.exit(1);
  });
} else {
  console.log("\n請用【GA4 zenith-mind 管理員】Google 帳號登入。");
  console.log("授權後若終端機失敗，複製網址列 code= 參數：");
  console.log(
    "  npx tsx --env-file=.env.local scripts/ga4-oauth-grant.mjs --code=貼上code\n"
  );

  let processed = false;

  const server = http.createServer(async (req, res) => {
    const path = req.url?.split("?")[0] ?? "/";
    if (path !== "/callback") {
      res.writeHead(404);
      res.end();
      return;
    }

    if (processed) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>已完成</h1>");
      return;
    }

    const url = new URL(req.url, "http://localhost:8765");
    const code = url.searchParams.get("code");
    const err = url.searchParams.get("error");

    if (err || !code) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>授權失敗</h1><p>${err ?? "缺少 code"}</p>`);
      return;
    }

    processed = true;

    try {
      await runWithCode(code);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>成功</h1><p>已加入服務帳號。</p>");
      server.close();
      process.exit(0);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>錯誤</h1><pre>${e.message}</pre>`);
      console.error("\n[FAIL]", e.message);
      server.close();
      process.exit(1);
    }
  });

  server.listen(8765, () => {
    console.log("本機回呼：", REDIRECT_URI);
    openBrowser(authUrl.toString());
  });
}
