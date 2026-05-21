import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const inv = JSON.parse(fs.readFileSync(path.join(root, ".audit-inventory.json"), "utf8"));

function tree(files) {
  const rootNode = {};
  for (const f of files) {
    const parts = f.rel.split("/");
    let cur = rootNode;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (i === parts.length - 1) {
        cur[p] = f.rel;
      } else {
        cur[p] = cur[p] ?? {};
        cur = cur[p];
      }
    }
  }
  function render(node, prefix = "") {
    const lines = [];
    const keys = Object.keys(node).sort();
    for (const k of keys) {
      const v = node[k];
      if (typeof v === "string") {
        lines.push(`${prefix}${k}`);
      } else {
        lines.push(`${prefix}${k}/`);
        lines.push(...render(v, prefix + "  "));
      }
    }
    return lines;
  }
  return render(rootNode).join("\n");
}

function fileBlock(f) {
  const isKey =
    /^(middleware|env\.ts|prisma\/schema|next\.config|app\/api\/|actions\/|domain\/|infrastructure\/db\/prisma)/.test(
      f.rel.replace(/\\/g, "/")
    ) && !f.rel.includes("__tests__");
  const lines = [
    `### \`${f.rel}\``,
    "",
    `功能說明：${f.summary || "【未讀取到原始檔案】"}`,
    `核心邏輯：${f.exports.length ? `exports: ${f.exports.join(", ")}` : "（無 named export 或為 default-only 模組）"}`,
    `依賴關係：${f.imports.length ? f.imports.join(", ") : "（無 import 或僅 side-effect）"}`,
    `輸入：${inferIO(f, "in")}`,
    `輸出：${inferIO(f, "out")}`,
    `是否關鍵模組（Y/N）：${isKey ? "Y" : f.rel.includes("app/api/") || f.rel.includes("middleware") ? "Y" : "N"}`,
    "",
  ];
  return lines.join("\n");
}

function inferIO(f, dir) {
  const r = f.rel.replace(/\\/g, "/");
  if (r.startsWith("app/api/") && r.endsWith("route.ts")) {
    const methods = [];
    const p = path.join(root, r);
    if (fs.existsSync(p)) {
      const t = fs.readFileSync(p, "utf8");
      for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
        if (new RegExp(`export\\s+async\\s+function\\s+${m}`).test(t)) methods.push(m);
      }
    }
    return dir === "in"
      ? `HTTP ${methods.join("/") || "【未讀取】"} Request`
      : `HTTP Response JSON/stream`;
  }
  if (r.startsWith("actions/") && r.endsWith(".ts")) {
    return dir === "in" ? "Server Action FormData/unknown input" : "ActionResult<T>";
  }
  if (r.endsWith("page.tsx")) return dir === "in" ? "Next.js params/searchParams" : "RSC React tree";
  return dir === "in" ? "模組呼叫參數" : "模組回傳值";
}

let md = `# Zenith Mind — CODEBASE AUDIT REPORT（FULL STATIC ANALYSIS）

| 產生方式 | \`scripts/audit-inventory.mjs\` 掃描 491 個原始檔 |
| 掃描時間 | 2026-05-19 |
| 規則 | 逐檔案、禁止摘要合併；內容來自檔案前 12KB 與 export 解析 |

---

# 第一部分：逐檔案系統分析（FILE INVENTORY）

## 1. 完整檔案樹（REAL FILE TREE）

\`\`\`
${tree(inv)}
\`\`\`

## 2. 每個檔案逐一說明

`;

for (const f of inv) {
  md += fileBlock(f);
}

fs.writeFileSync(path.join(root, "docs/CODEBASE-AUDIT-REPORT.md"), md);
console.log("wrote docs/CODEBASE-AUDIT-REPORT.md", md.length);
