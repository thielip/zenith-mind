import { DEFAULT_QUICK_LINKS } from "@/lib/site/default-quick-links";
import type { QuickLinkItem } from "@/lib/site/types";

/** 依語系解析快速導覽標籤（英文缺 labelEn 時對照預設 href） */
export function resolveQuickLinkLabel(link: QuickLinkItem, isEn: boolean): string {
  if (!isEn) return link.label;
  if (link.labelEn?.trim()) return link.labelEn.trim();
  const def = DEFAULT_QUICK_LINKS.find(
    (d) => d.href.trim().toLowerCase() === link.href.trim().toLowerCase()
  );
  return def?.labelEn?.trim() || link.label;
}
