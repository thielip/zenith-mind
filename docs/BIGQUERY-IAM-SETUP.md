# BigQuery 權限修復（作戰中心「異常」）

## 錯誤訊息

```
Permission bigquery.tables.list denied on dataset getzenithmind:my_getzenithmind
```

代表 **GA4 服務帳號**（`GA4_CLIENT_EMAIL`，例如 `ga4-api-reader@getzenithmind.iam.gserviceaccount.com`）  
在 GCP 專案 `getzenithmind` 上，對資料集 `my_getzenithmind` **沒有 BigQuery 讀取權限**。

Vercel 環境變數已設定 ≠ IAM 已授權。

## 修復步驟（GCP Console）

### 方式 A：專案層級（建議）

1. 開啟 [GCP IAM](https://console.cloud.google.com/iam-admin/iam?project=getzenithmind)
2. 找到成員：`ga4-api-reader@getzenithmind.iam.gserviceaccount.com`（與 `GA4_CLIENT_EMAIL` 相同）
3. 編輯 → **新增角色** → **BigQuery Data Viewer**（`roles/bigquery.dataViewer`）
4. 儲存

### 方式 B：僅授權單一資料集

1. [BigQuery](https://console.cloud.google.com/bigquery?project=getzenithmind) → 資料集 `my_getzenithmind`
2. **分享** → **新增主體**
3. 主體：`ga4-api-reader@getzenithmind.iam.gserviceaccount.com`
4. 角色：**BigQuery Data Viewer**
5. 儲存

### 若資料集不存在

在 BigQuery 建立資料集 ID：`my_getzenithmind`（與 `BIGQUERY_DATASET_ID` 一致），或將 Vercel／整合設定改為實際存在的 dataset ID。

## 驗證

1. 後台 → **作戰中心 → 外部串接設定 → BigQuery** → **啟動連線**
2. 或 **安全** 頁 → **重新偵測**
3. 狀態應為 **已啟動**／健檢 **正常**

## 環境變數（應已存在於 Vercel）

| 變數 | 範例 |
|------|------|
| `BIGQUERY_DATASET_ID` | `my_getzenithmind` |
| `GOOGLE_CLOUD_PROJECT_ID` | `getzenithmind`（選填，可從 GA4 服務帳號推斷） |
| `GA4_CLIENT_EMAIL` | `ga4-api-reader@getzenithmind.iam.gserviceaccount.com` |
| `GA4_PRIVATE_KEY` | 服務帳號 JSON 私鑰 |

修改 IAM 後**無需** Redeploy；約 1–2 分鐘生效。
