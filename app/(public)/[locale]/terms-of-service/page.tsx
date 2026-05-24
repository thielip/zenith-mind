import { redirect } from "next/navigation";
import { LEGAL_PAGES } from "@/lib/legal/pages";

/** 雙語法律頁僅使用根路徑（無語系前綴） */
export default function LocaleTermsOfServiceRedirect() {
  redirect(LEGAL_PAGES["terms-of-service"].path);
}
