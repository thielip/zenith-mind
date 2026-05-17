export type IntegrationHealthState = "ok" | "missing" | "error";

export interface IntegrationHealthItem {
  id: string;
  name: string;
  description: string;
  status: IntegrationHealthState;
  missing: string[];
  detail?: string;
}

export interface IntegrationHealthReport {
  checkedAt: string;
  items: IntegrationHealthItem[];
  summary: { ok: number; missing: number; error: number };
}
