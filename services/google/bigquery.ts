import { google } from "googleapis";
import { createGoogleAuth, getServiceAccountCredentials } from "./auth";

const SCOPES = ["https://www.googleapis.com/auth/bigquery.readonly"];

function resolveProjectId(): string | undefined {
  return (
    process.env["GOOGLE_CLOUD_PROJECT_ID"]?.trim() ??
    process.env["GA4_CLIENT_EMAIL"]?.split("@")[1]?.split(".")[0]
  );
}

function formatIamHelp(projectId: string, datasetId: string): string {
  const email =
    process.env["GA4_CLIENT_EMAIL"]?.trim() ??
    "（GA4 服務帳號，見 GA4_CLIENT_EMAIL）";
  return (
    `權限不足：請在 GCP 專案「${projectId}」為 ${email} 新增角色 ` +
    `「BigQuery Data Viewer」(roles/bigquery.dataViewer)，` +
    `或至 BigQuery → 資料集「${datasetId}」→ 分享 → 加入該服務帳號。` +
    ` 詳見 docs/BIGQUERY-IAM-SETUP.md`
  );
}

function isAccessDenied(message: string): boolean {
  return /access denied|permission .* denied|403/i.test(message);
}

export async function fetchBigQueryHealth(): Promise<{
  ok: boolean;
  message: string;
  rowCount?: number;
}> {
  const datasetId = process.env["BIGQUERY_DATASET_ID"]?.trim();
  const projectId = resolveProjectId();

  if (!datasetId || !projectId) {
    return { ok: false, message: "缺少 BIGQUERY_DATASET_ID 或 GCP 專案 ID" };
  }

  const auth = createGoogleAuth(SCOPES);
  if (!auth) {
    return { ok: false, message: "GA4 服務帳號未設定（GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY）" };
  }

  const creds = getServiceAccountCredentials();
  const saEmail = creds?.client_email ?? "unknown";

  try {
    const bigquery = google.bigquery({ version: "v2", auth });

    // 先確認資料集存在（所需權限通常低於 tables.list）
    await bigquery.datasets.get({ projectId, datasetId });

    const tables = await bigquery.tables.list({
      projectId,
      datasetId,
      maxResults: 5,
    });
    const count = tables.data.tables?.length ?? 0;
    return {
      ok: true,
      message: `專案 ${projectId}／資料集 ${datasetId} 可存取（服務帳號 ${saEmail}，${count} 張表）`,
      rowCount: count,
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "BigQuery API 失敗";
    if (isAccessDenied(raw)) {
      return { ok: false, message: formatIamHelp(projectId, datasetId) };
    }
    if (/not found|404/i.test(raw)) {
      return {
        ok: false,
        message: `資料集 ${projectId}:${datasetId} 不存在。請在 BigQuery 建立資料集或修正 BIGQUERY_DATASET_ID。`,
      };
    }
    return { ok: false, message: raw };
  }
}
