/**
 * GA4 服務帳號診斷（不輸出私鑰）
 * 用法：npx tsx --env-file=.env.local scripts/ga4-diagnose.mjs
 */
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const email = process.env.GA4_CLIENT_EMAIL?.trim();
let privateKey = process.env.GA4_PRIVATE_KEY ?? "";
const propertyId = process.env.GA4_PROPERTY_ID?.trim();

if (!email || !privateKey || !propertyId) {
  console.error("缺少 GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY / GA4_PROPERTY_ID");
  process.exit(1);
}

privateKey = privateKey.replace(/\\n/g, "\n");

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken(scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign
    .sign(privateKey)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Token 失敗: ${body.error ?? res.status} ${body.error_description ?? ""}`);
  }
  return body.access_token;
}

async function apiGet(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { ok: res.ok, status: res.status, json };
}

console.log("=== GA4 服務帳號診斷 ===\n");
console.log("服務帳號 email:", email);
console.log("Property ID:", propertyId);
console.log("私鑰格式:", privateKey.includes("BEGIN PRIVATE KEY") ? "PEM OK" : "異常");
console.log("email 長度:", email.length, "（含 @ 應約 60+ 字元）");
if (/\s/.test(email)) console.warn("⚠ email 含空白字元，GA4 UI 會驗證失敗");

// 1) 金鑰能否換 token
let tokenReadonly;
let tokenAdmin;
try {
  tokenReadonly = await getAccessToken(
    "https://www.googleapis.com/auth/analytics.readonly"
  );
  console.log("\n[OK] 服務帳號金鑰有效，可取得 access token（readonly）");
} catch (e) {
  console.error("\n[FAIL] 金鑰無法換 token — GCP 服務帳號或私鑰有問題:", e.message);
  console.log("→ 到 GCP 確認服務帳號存在，並重新建立 JSON 金鑰");
  process.exit(1);
}

try {
  tokenAdmin = await getAccessToken(
    "https://www.googleapis.com/auth/analytics.manage.users.readonly"
  );
  console.log("[OK] 可取得 analytics.manage.users.readonly token");
} catch (e) {
  console.warn("[WARN] manage.users token:", e.message);
  tokenAdmin = tokenReadonly;
}

// 2) Data API — 與儀表板相同探測
const dataUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
const dataRes = await fetch(dataUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${tokenReadonly}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    dateRanges: [{ startDate: "yesterday", endDate: "today" }],
    metrics: [{ name: "activeUsers" }],
  }),
});
const dataBody = await dataRes.json();
if (dataRes.ok) {
  console.log("\n[OK] Data API 可讀取 Property", propertyId);
} else {
  console.log("\n[FAIL] Data API:", dataRes.status, dataBody.error?.message ?? dataBody);
}

// 3) Admin API — 此 SA 目前能看到哪些資源
const summaries = await apiGet(
  "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
  tokenAdmin
);
if (summaries.ok) {
  const list = summaries.json.accountSummaries ?? [];
  console.log("\n[INFO] 服務帳號目前可見的 GA 帳戶數:", list.length);
  if (list.length === 0) {
    console.log("  → 尚未被授予任何 GA4 帳戶/資源權限（與 UI 新增失敗一致）");
  } else {
    for (const a of list) {
      console.log(`  帳戶: ${a.displayName} (${a.account})`);
      for (const p of a.propertySummaries ?? []) {
        console.log(`    資源: ${p.displayName} — ${p.property}`);
      }
    }
  }
} else if (summaries.json?.error?.status === "PERMISSION_DENIED") {
  console.log("\n[INFO] Admin API accountSummaries: 無權限（正常，尚未加入 GA4）");
} else {
  console.log("\n[WARN] Admin API:", summaries.status, summaries.json?.error?.message);
  if (summaries.json?.error?.message?.includes("has not been used")) {
    console.log("  → 請啟用 Google Analytics Admin API:");
    console.log(
      "     https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com?project=my-blog-analytics-495817"
    );
  }
}

// 4) 嘗試讀取目標 Property metadata
const prop = await apiGet(
  `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}`,
  tokenAdmin
);
if (prop.ok) {
  console.log("\n[OK] 可讀取 Property metadata:", prop.json.displayName);
} else {
  console.log(
    "\n[INFO] 無法讀取 Property metadata:",
    prop.json?.error?.message ?? prop.status
  );
}

// 5) 列出 Property 現有使用者（需 manage.users）
const bindings = await apiGet(
  `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/accessBindings`,
  tokenAdmin
);
if (bindings.ok) {
  const users = bindings.json.accessBindings ?? [];
  console.log("\n[INFO] Property 現有存取者數:", users.length);
  const sa = users.filter((u) => u.user?.includes("gserviceaccount.com"));
  console.log("  其中服務帳號:", sa.length ? sa.map((u) => u.user).join(", ") : "（無）");
} else {
  console.log(
    "\n[INFO] 無法列出 accessBindings（需以「人類管理員」OAuth 或已授權的 SA）:",
    bindings.json?.error?.message ?? bindings.status
  );
}

console.log("\n=== 結論與建議 ===");
if (!dataRes.ok) {
  const msg = dataBody.error?.message ?? "";
  if (msg.includes("sufficient permissions")) {
    console.log(
      "根因：服務帳號在 Google 身分系統存在且金鑰有效，但未加入 GA4 Property",
      propertyId,
      "的存取名單。"
    );
    console.log("\nGA4 UI 顯示「請輸入電子郵件」/「與 Google 帳戶不符」常見原因：");
    console.log("  A) 服務帳號建立未滿 10 分鐘（等傳播後重試）");
    console.log("  B) 貼上時含全形字元、空格、換行 — 請手動輸入 email");
    console.log("  C) 應在「帳戶」層級新增，而非僅資源層級（見下方步驟）");
    console.log("  D) 你的 GA4 登入帳號不是管理員 — 需由現有管理員新增");
    console.log("\n建議操作順序：");
    console.log(
      "  1) GCP 確認 SA 存在: https://console.cloud.google.com/iam-admin/serviceaccounts?project=my-blog-analytics-495817"
    );
    console.log(
      "  2) 啟用 Analytics Admin API: https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com?project=my-blog-analytics-495817"
    );
    console.log("  3) GA4 → 管理 → 【帳戶】欄 → 帳戶存取管理 → 新增使用者（檢視者）");
    console.log("     若帳戶層級成功，再到【資源】欄 → Property 存取管理確認已繼承");
    console.log("  4) 或改用新 email（新建 SA 名稱 ga4-reader-v2）避免幽靈帳號");
  }
}
