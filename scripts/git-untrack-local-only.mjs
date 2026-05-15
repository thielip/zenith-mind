// 從 Git 索引移除不應上傳的本地檔（檔案仍保留在本機）
import { execSync } from "node:child_process";

const tracked = execSync("git ls-files -z", { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const remove = tracked.filter(
  (f) => f.endsWith(".docx") || f.startsWith("\u5716\u7a3f/")
);

for (const file of remove) {
  execSync(`git rm --cached -f -- ${JSON.stringify(file)}`, { stdio: "inherit" });
}

console.log(`Removed ${remove.length} path(s) from git index.`);
