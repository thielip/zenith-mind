import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import {
  dateRangeFromParams,
  type AuditLogListParams,
} from "@/lib/admin/audit-log-params";
import { batchCountryLabels } from "@/lib/geoip/country-for-ip";

export interface AuditLogRow {
  id: string;
  createdAt: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  ip: string | null;
  ipCountry: string | null;
  requestId: string | null;
  userAgent: string | null;
  userEmail: string | null;
}

export interface AuditLogOperator {
  id: string;
  email: string;
}

function buildWhere(params: AuditLogListParams): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  const createdAt = dateRangeFromParams(params);
  if (createdAt.gte || createdAt.lte) {
    where.createdAt = createdAt;
  }

  if (params.action !== "all") {
    where.action = params.action;
  }

  if (params.userId) {
    where.userId = params.userId;
  }

  if (params.q) {
    const q = params.q;
    where.OR = [
      { entityId: { contains: q, mode: "insensitive" } },
      { requestId: { contains: q, mode: "insensitive" } },
      { entityType: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function displayIp(stored: string | null): string | null {
  if (!stored) return null;
  if (stored === "masked") return "（舊紀錄：已遮罩）";
  return stored;
}

export async function loadAuditLogOperators(): Promise<AuditLogOperator[]> {
  const users = await prisma.user.findMany({
    where: {
      auditLogs: { some: {} },
      deletedAt: null,
    },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });
  return users;
}

export async function loadAuditLogs(params: AuditLogListParams) {
  const where = buildWhere(params);
  const skip = (params.page - 1) * params.perPage;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: params.perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const ips = logs.map((l) => displayIp(l.ipMasked)).filter(Boolean) as string[];
  const countries = await batchCountryLabels(ips);

  const rows: AuditLogRow[] = logs.map((log) => {
    const ip = displayIp(log.ipMasked);
    return {
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      ip,
      ipCountry: ip ? countries.get(ip) ?? null : null,
      requestId: log.requestId,
      userAgent: log.userAgent,
      userEmail: log.user?.email ?? null,
    };
  });

  return {
    logs: rows,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.perPage)),
  };
}

export async function loadAuditLogsForExport(
  params: AuditLogListParams,
  maxRows = 5000
) {
  const where = buildWhere(params);
  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: maxRows,
  });

  return logs.map((log) => ({
    createdAt: log.createdAt.toISOString(),
    userEmail: log.user?.email ?? "",
    action: log.action,
    entityType: log.entityType ?? "",
    entityId: log.entityId ?? "",
    ip: displayIp(log.ipMasked) ?? "",
    requestId: log.requestId ?? "",
    metadata: log.metadata ? JSON.stringify(log.metadata) : "",
  }));
}
