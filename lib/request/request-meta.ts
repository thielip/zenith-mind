import { headers } from "next/headers";
import { resolveClientIpFromHeaders } from "@/lib/request/client-ip";

export interface RequestMeta {
  ip: string;
  userAgent: string;
  requestId: string;
}

export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  return {
    ip: resolveClientIpFromHeaders(h),
    userAgent: h.get("user-agent") ?? "",
    requestId: crypto.randomUUID(),
  };
}
