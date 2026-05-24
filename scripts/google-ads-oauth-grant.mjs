/**
 * 取得 Google Ads OAuth Refresh Token（需 Google Ads 管理員帳號登入）
 *
 * GCP → OAuth 用戶端 → 授權重新導向 URI 須包含：
 *   http://localhost:8766/callback
 *
 * 用法：
 *   npx tsx --env-file=.env.local scripts/google-ads-oauth-grant.mjs
 *   npx tsx --env-file=.env.local scripts/google-ads-oauth-grant.mjs --code=4/0xxxx
 */
import http from "node:http";
import { execSync } from "node:child_process";

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
const REDIRECT_URI = "http://localhost:8766/callback";
const SCOPE = "https://www.googleapis.com/auth/adwords";

const codeArg = process.argv.find((a) => a.startsWith("--code="))?.slice(7);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "請在 .env.local 設定 GOOGLE_ADS_CLIENT_ID 與 GOOGLE_ADS_CLIENT_SECRET，或於整合中心先儲存草稿後再執行。"
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

async function exchangeCode(code) {
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
  const body = await res.json();
  if (!res.ok) {
    throw new Error(
      `${body.error ?? res.status}: ${body.error_description ?? JSON.stringify(body)}`
    );
  }
  if (!body.refresh_token) {
    throw new Error(
      "未取得 refresh_token。請確認 OAuth 授權網址含 access_type=offline 且 prompt=consent，並用尚未授權過的帳號重試。"
    );
  }
  return body;
}

async function runWithCode(code) {
  const tokens = await exchangeCode(code);
  console.log("\n=== 成功 ===\n");
  console.log("請將下列 Refresh Token 貼到後台「整合中心 → Google Ads」欄位，然後按「啟動連線」：\n");
  console.log(tokens.refresh_token);
  console.log(
    "\n或寫入 .env.local 後執行：\n  npx tsx --env-file=.env.local scripts/upsert-google-ads-from-env.mjs\n"
  );
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("=== Google Ads OAuth Refresh Token ===\n");
console.log("Client ID 前綴:", CLIENT_ID.slice(0, 20) + "…");
console.log("Scope:", SCOPE);
console.log("Redirect URI（須已加入 GCP OAuth 用戶端）:", REDIRECT_URI);

if (codeArg) {
  runWithCode(codeArg).catch((e) => {
    console.error("\n[FAIL]", e.message);
    process.exit(1);
  });
} else {
  console.log("\n請用【擁有 Google Ads 帳戶 8702788584 權限】的 Google 帳號登入並授權。");
  console.log("授權後若本機回呼失敗，複製網址列 code= 參數：");
  console.log(
    "  npx tsx --env-file=.env.local scripts/google-ads-oauth-grant.mjs --code=貼上code\n"
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
    const url = new URL(req.url, "http://localhost:8766");
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
      res.end("<h1>成功</h1><p>請回到終端機複製 Refresh Token。</p>");
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

  server.listen(8766, () => {
    console.log("本機回呼：", REDIRECT_URI);
    openBrowser(authUrl.toString());
  });
}
