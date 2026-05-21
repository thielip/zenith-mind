import nodemailer from "nodemailer";
import { resolveAlertEmail } from "@/lib/alert/resolve-alert-email";

export interface SendAlertEmailInput {
  subject: string;
  text: string;
  html?: string;
}

/** 可選 SMTP 告警；未設定 ALERT_EMAIL_* 時靜默略過 */
export async function sendAlertEmail(
  input: SendAlertEmailInput
): Promise<{ sent: boolean; reason?: string }> {
  const { user, pass, to } = resolveAlertEmail();
  if (!user || !pass || !to) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transport.sendMail({
    from: user,
    to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, "<br>"),
  });

  return { sent: true };
}
