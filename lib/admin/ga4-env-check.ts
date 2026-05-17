const VALID_PROPERTY_ID = "536903218";
const VALID_ACCOUNT_ID = "394118928";
const VALID_MEASUREMENT_ID = "G-4C955FQCZ2";

export interface Ga4EnvCheck {
  propertyId: string;
  accountId: string | undefined;
  measurementId: string | undefined;
  warnings: string[];
  isPropertyIdValid: boolean;
}

/** 儀表板用：檢查 GA4 ID 是否填錯（常見：帳戶 ID 當 Property ID） */
export function checkGa4Env(): Ga4EnvCheck {
  const propertyId = process.env["GA4_PROPERTY_ID"]?.trim() ?? "";
  const accountId = process.env["GA4_ACCOUNT_ID"]?.trim();
  const measurementId = process.env["NEXT_PUBLIC_GA4_MEASUREMENT_ID"]?.trim();
  const warnings: string[] = [];

  if (propertyId === accountId) {
    warnings.push(
      `GA4_PROPERTY_ID（${propertyId}）與 GA4_ACCOUNT_ID 相同；Property 應為資源「SEO部落格」ID：${VALID_PROPERTY_ID}，帳戶 ID 為 ${VALID_ACCOUNT_ID}。`
    );
  }
  if (propertyId === VALID_ACCOUNT_ID) {
    warnings.push(
      `GA4_PROPERTY_ID 目前為帳戶 ID（${VALID_ACCOUNT_ID}），請改為 Property ID：${VALID_PROPERTY_ID}。`
    );
  }
  if (propertyId === "533209763") {
    warnings.push("GA4_PROPERTY_ID 仍為舊值 533209763，請改為 536903218。");
  }
  if (measurementId && measurementId !== VALID_MEASUREMENT_ID) {
    warnings.push(
      `Measurement ID 為 ${measurementId}，與專案設定 ${VALID_MEASUREMENT_ID} 不一致（若有多個 GA4 資源請確認 .env.local）。`
    );
  }

  const isPropertyIdValid = propertyId === VALID_PROPERTY_ID;

  return {
    propertyId,
    accountId,
    measurementId,
    warnings,
    isPropertyIdValid,
  };
}
