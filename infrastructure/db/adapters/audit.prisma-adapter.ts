// infrastructure/db/adapters/audit.prisma-adapter.ts
// Audit Log 非同步寫入（Level 3 必備）
// ⚠ 永遠不 await，不阻塞主流程

import { prisma } from "@/infrastructure/db/prisma";
import type { AuditAction, Prisma } from "@prisma/client";
import { resolveClientIpFromHeaders } from "@/lib/request/client-ip";

/** @deprecated 舊版遮罩格式；新紀錄改存完整 IP */
export function maskIp(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";
  const v4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (v4?.[1]) return `${v4[1]}.***`;
  const parts = ip.split(":");
  if (parts.length > 4) return parts.slice(0, 4).join(":") + ":****:****:****:****";
  return "masked";
}

/** 寫入稽核日誌用的 IP（完整位址，供後台追蹤） */
export function normalizeAuditIp(ip: string | undefined): string | null {
  if (!ip?.trim() || ip === "unknown") return null;
  return ip.trim();
}

export { resolveClientIpFromHeaders };

export interface WriteAuditInput {
  action:     AuditAction;
  userId?:    string;
  entityType?: string;
  entityId?:  string;
  metadata?:  Prisma.InputJsonValue;
  ip?:        string;
  userAgent?: string;
  requestId?: string;
}

/**
 * 非同步寫入 Audit Log
 * 使用方式：void writeAuditLog({ ... })
 */
export function writeAuditLog(input: WriteAuditInput): void {
  prisma.auditLog
    .create({
      data: {
        action:     input.action,
        userId:     input.userId,
        entityType: input.entityType,
        entityId:   input.entityId,
        metadata:   input.metadata,
        ipMasked:   normalizeAuditIp(input.ip),
        userAgent:  input.userAgent?.slice(0, 500) ?? null,
        requestId:  input.requestId,
      },
    })
    .catch((err: unknown) => {
      console.error("[AuditLog] Write failed:", err);
    });
}

/** 清理 90 天前的 Audit Log（Cron Job 每日呼叫）*/
export async function cleanupAuditLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return count;
}

/** 清理 180 天前的 PageView（Cron Job 每日呼叫）*/
export async function cleanupPageViews(): Promise<number> {
  const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.pageView.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return count;
}
