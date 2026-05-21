import type { AuditAction } from "@prisma/client";

export const AUDIT_LOG_PER_PAGE_OPTIONS = [20, 50, 100] as const;
export type AuditLogPerPage = (typeof AUDIT_LOG_PER_PAGE_OPTIONS)[number];

export const AUDIT_FILTER_ACTIONS = [
  { value: "all", label: "全部" },
  { value: "CREATE", label: "建立" },
  { value: "UPDATE", label: "更新" },
  { value: "DELETE", label: "刪除" },
  { value: "LOGIN", label: "登入" },
  { value: "LOGOUT", label: "登出" },
] as const;

export type AuditDatePreset = "all" | "today" | "last7" | "custom";

export interface AuditLogListParams {
  page: number;
  perPage: AuditLogPerPage;
  action: AuditAction | "all";
  userId: string | null;
  q: string;
  datePreset: AuditDatePreset;
  from: string | null;
  to: string | null;
}

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseAuditLogListParams(
  sp: Record<string, string | string[] | undefined>
): AuditLogListParams {
  const page = Math.max(1, Number.parseInt(firstString(sp.page) ?? "1", 10) || 1);
  const perPageRaw = Number.parseInt(firstString(sp.perPage) ?? "50", 10);
  const perPage = AUDIT_LOG_PER_PAGE_OPTIONS.includes(perPageRaw as AuditLogPerPage)
    ? (perPageRaw as AuditLogPerPage)
    : 50;

  const actionRaw = firstString(sp.action) ?? "all";
  const action =
    actionRaw === "all" ||
    actionRaw === "CREATE" ||
    actionRaw === "UPDATE" ||
    actionRaw === "DELETE" ||
    actionRaw === "LOGIN" ||
    actionRaw === "LOGOUT" ||
    actionRaw === "TOTP_SETUP" ||
    actionRaw === "TOTP_VERIFY" ||
    actionRaw === "AI_GENERATE" ||
    actionRaw === "PUBLISH" ||
    actionRaw === "SCHEDULE"
      ? actionRaw
      : "all";

  const userId = (firstString(sp.userId) ?? "").trim() || null;
  const q = (firstString(sp.q) ?? "").trim();
  const datePresetRaw = firstString(sp.date) ?? "all";
  const datePreset: AuditDatePreset =
    datePresetRaw === "today" || datePresetRaw === "last7" || datePresetRaw === "custom"
      ? datePresetRaw
      : "all";

  const from = (firstString(sp.from) ?? "").trim() || null;
  const to = (firstString(sp.to) ?? "").trim() || null;

  return { page, perPage, action, userId, q, datePreset, from, to };
}

export function dateRangeFromParams(params: AuditLogListParams): {
  gte?: Date;
  lte?: Date;
} {
  const now = new Date();
  const endOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
  );

  if (params.datePreset === "today") {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    return { gte: start, lte: endOfToday };
  }

  if (params.datePreset === "last7") {
    const start = new Date(endOfToday);
    start.setUTCDate(start.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);
    return { gte: start, lte: endOfToday };
  }

  if (params.datePreset === "custom") {
    const range: { gte?: Date; lte?: Date } = {};
    if (params.from) {
      const d = new Date(`${params.from}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) range.gte = d;
    }
    if (params.to) {
      const d = new Date(`${params.to}T23:59:59.999Z`);
      if (!Number.isNaN(d.getTime())) range.lte = d;
    }
    return range;
  }

  return {};
}

export function buildAuditLogListQuery(
  params: AuditLogListParams,
  patch: Partial<AuditLogListParams>
): string {
  const next = { ...params, ...patch };
  const search = new URLSearchParams();
  if (next.page > 1) search.set("page", String(next.page));
  if (next.perPage !== 50) search.set("perPage", String(next.perPage));
  if (next.action !== "all") search.set("action", next.action);
  if (next.userId) search.set("userId", next.userId);
  if (next.q) search.set("q", next.q);
  if (next.datePreset !== "all") search.set("date", next.datePreset);
  if (next.from) search.set("from", next.from);
  if (next.to) search.set("to", next.to);
  const qs = search.toString();
  return qs ? `/admin/audit-log?${qs}` : "/admin/audit-log";
}

export function buildAuditLogExportQuery(params: AuditLogListParams): string {
  const search = new URLSearchParams();
  if (params.action !== "all") search.set("action", params.action);
  if (params.userId) search.set("userId", params.userId);
  if (params.q) search.set("q", params.q);
  if (params.datePreset !== "all") search.set("date", params.datePreset);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const qs = search.toString();
  return qs ? `/api/admin/audit-log/export?${qs}` : "/api/admin/audit-log/export";
}
