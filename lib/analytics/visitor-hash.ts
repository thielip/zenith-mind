import { createHash, randomUUID } from "node:crypto";

/** Edge（Web Crypto）與 Node 雙相容；避免 CF Worker 僅依賴 node:crypto 頂層 import 行為 */
export async function sha256Hex(input: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(input)
    );
    return [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return createHash("sha256").update(input).digest("hex");
}

export function newPageViewId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return randomUUID();
}
