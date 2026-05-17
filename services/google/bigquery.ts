import { google } from "googleapis";
import { createGoogleAuth } from "./auth";

const SCOPES = ["https://www.googleapis.com/auth/bigquery.readonly"];

export async function fetchBigQueryHealth(): Promise<{
  ok: boolean;
  message: string;
  rowCount?: number;
}> {
  const datasetId = process.env["BIGQUERY_DATASET_ID"]?.trim();
  const projectId =
    process.env["GOOGLE_CLOUD_PROJECT_ID"]?.trim() ??
    process.env["GA4_CLIENT_EMAIL"]?.split("@")[1]?.split(".")[0];

  if (!datasetId || !projectId) {
    return { ok: false, message: "缺少 BIGQUERY_DATASET_ID 或 GCP 專案 ID" };
  }

  const auth = createGoogleAuth(SCOPES);
  if (!auth) {
    return { ok: false, message: "GA4 服務帳號未設定" };
  }

  try {
    const bigquery = google.bigquery({ version: "v2", auth });
    const tables = await bigquery.tables.list({
      projectId,
      datasetId,
      maxResults: 5,
    });
    const count = tables.data.tables?.length ?? 0;
    return {
      ok: true,
      message: `資料集 ${datasetId} 可存取（${count} 張表）`,
      rowCount: count,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "BigQuery API 失敗",
    };
  }
}
