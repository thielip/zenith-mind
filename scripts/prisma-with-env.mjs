import { spawn } from "node:child_process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/prisma-with-env.mjs <prisma args...>");
  process.exit(1);
}

const command = "npx";
const env = Object.fromEntries(
  Object.entries(process.env).filter((entry) => typeof entry[1] === "string")
);
const child = spawn(command, ["prisma", ...args], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
