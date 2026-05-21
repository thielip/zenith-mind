import { z } from "zod";

const emailSchema = z.string().email();

export interface ResolvedAlertEmail {
  user: string | undefined;
  pass: string | undefined;
  to: string | undefined;
  warnings: string[];
}

function readOptional(name: "ALERT_EMAIL_USER" | "ALERT_EMAIL_PASS" | "ALERT_EMAIL_TO") {
  const raw = process.env[name];
  if (raw === undefined || raw === null) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** 執行期解析告警信箱；格式錯誤僅 warn，不阻擋 build */
export function resolveAlertEmail(): ResolvedAlertEmail {
  const warnings: string[] = [];
  let user = readOptional("ALERT_EMAIL_USER");
  let pass = readOptional("ALERT_EMAIL_PASS");
  let to = readOptional("ALERT_EMAIL_TO");

  if (user && !emailSchema.safeParse(user).success) {
    warnings.push(`ALERT_EMAIL_USER 格式無效（${user}），已忽略`);
    user = undefined;
  }
  if (to && !emailSchema.safeParse(to).success) {
    warnings.push(`ALERT_EMAIL_TO 格式無效（${to}），已忽略`);
    to = undefined;
  }

  if (user && !pass) {
    warnings.push("已設定 ALERT_EMAIL_USER 但缺少 ALERT_EMAIL_PASS，SMTP 告警將略過");
  }

  if (warnings.length > 0) {
    console.warn("[alert-email]", warnings.join(" · "));
  }

  return { user, pass, to, warnings };
}
