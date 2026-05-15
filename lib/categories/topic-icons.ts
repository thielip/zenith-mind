import type { LucideIcon } from "lucide-react";
import { Cpu, FolderOpen, Globe2, GraduationCap, LineChart, Sparkles } from "lucide-react";

const TOPIC_ICONS: Record<string, LucideIcon> = {
  international: Globe2,
  finance:       LineChart,
  ai:            Cpu,
  education:     GraduationCap,
  lifestyle:     Sparkles,
  other:         FolderOpen,
};

export function topicIconForSlug(slug: string): LucideIcon {
  return TOPIC_ICONS[slug] ?? FolderOpen;
}
