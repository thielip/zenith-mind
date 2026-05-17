"use client";

import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { KpiMetricCard } from "@/widgets/kpi-grid/kpi-metric-card";
import { GlassCard } from "@/shared/ui/glass-card";
import type { KpiMetric } from "@/types/command-center/metrics";

export interface ModuleSection {
  title: string;
  content: React.ReactNode;
}

interface ModuleShellProps {
  title: string;
  description: string;
  kpis: KpiMetric[];
  sections: ModuleSection[];
  headerExtra?: React.ReactNode;
}

export function ModuleShell({
  title,
  description,
  kpis,
  sections,
  headerExtra,
}: ModuleShellProps) {
  return (
    <div className="space-y-6">
      <ModuleHeader title={title} description={description} />
      {headerExtra}
      {kpis.length > 0 ? (
        <KpiGrid kpis={kpis} />
      ) : null}
      <SectionsGrid sections={sections} />
    </div>
  );
}

function KpiGrid({ kpis }: { kpis: KpiMetric[] }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => (
        <KpiMetricCard key={k.id} metric={k} />
      ))}
    </div>
  );
}

function SectionsGrid({ sections }: { sections: ModuleSection[] }) {
  return (
    <div className="grid gap-6">
      {sections.map((section) => (
        <GlassCard key={section.title} className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">{section.title}</h2>
          {section.content}
        </GlassCard>
      ))}
    </div>
  );
}
