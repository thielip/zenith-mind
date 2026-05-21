export type ForecastMetric = "sessions" | "pageViews" | "conversions";
export type ForecastHorizon = 7 | 14 | 30;

export interface TrafficHistoryPoint {
  date: string;
  sessions: number;
  pageViews: number;
}

export interface ForecastModelOptions {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  excludeOutliers: boolean;
}

export interface ForecastSeriesPoint {
  date: string;
  label: string;
  actual: number | null;
  projected: number | null;
  lower: number | null;
  upper: number | null;
  kind: "actual" | "forecast";
}

export interface ForecastKpis {
  totalProjected: number;
  dailyAverage: number;
  growthLabel: string;
  growthTrend: "up" | "down" | "flat";
  modelNote: string;
}

function formatLabel(isoDate: string): string {
  if (isoDate.length >= 10) {
    const [, m, d] = isoDate.split("-");
    return `${m}/${d}`;
  }
  return isoDate.length >= 8
    ? `${isoDate.slice(4, 6)}/${isoDate.slice(6, 8)}`
    : isoDate;
}

function metricValue(p: TrafficHistoryPoint, metric: ForecastMetric): number {
  if (metric === "pageViews") return p.pageViews;
  if (metric === "conversions") return Math.max(0, Math.round(p.sessions * 0.028));
  return p.sessions;
}

function filterOutliers(values: number[]): number[] {
  if (values.length < 4) return values;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance) || 1;
  const cap = mean + 2 * std;
  const floor = Math.max(0, mean - 2 * std);
  return values.map((v) => (v > cap ? cap : v < floor ? floor : v));
}

function linearSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += i;
    sumY += values[i] ?? 0;
    sumXY += i * (values[i] ?? 0);
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

export function buildForecastFromHistory(
  history: TrafficHistoryPoint[],
  options: ForecastModelOptions
): {
  series: ForecastSeriesPoint[];
  forecastRows: Array<{
    date: string;
    value: number;
    lower: number;
    upper: number;
  }>;
  kpis: ForecastKpis;
} {
  const sorted = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const rawValues = sorted.map((p) => metricValue(p, options.metric));
  const values = options.excludeOutliers
    ? filterOutliers(rawValues)
    : rawValues;

  const slope = linearSlope(values);
  const lastActual = values[values.length - 1] ?? 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const actualSeries: ForecastSeriesPoint[] = sorted.map((p, i) => {
    const v = values[i] ?? 0;
    const spread = Math.max(1, Math.round(v * 0.12));
    return {
      date: p.date,
      label: formatLabel(p.date),
      actual: v,
      projected: null,
      lower: Math.max(0, v - spread),
      upper: v + spread,
      kind: "actual" as const,
    };
  });

  const forecastRows: Array<{
    date: string;
    value: number;
    lower: number;
    upper: number;
  }> = [];

  const forecastSeries: ForecastSeriesPoint[] = [];

  for (let i = 1; i <= options.horizon; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const projected = Math.max(
      0,
      Math.round(lastActual + slope * (sorted.length - 1 + i))
    );
    const margin = Math.max(1, Math.round(projected * 0.15));
    forecastRows.push({
      date: iso,
      value: projected,
      lower: Math.max(0, projected - margin),
      upper: projected + margin,
    });
    forecastSeries.push({
      date: iso,
      label: formatLabel(iso),
      actual: null,
      projected,
      lower: Math.max(0, projected - margin),
      upper: projected + margin,
      kind: "forecast",
    });
  }

  const totalProjected = forecastRows.reduce((s, r) => s + r.value, 0);
  const dailyAverage = Math.round(totalProjected / options.horizon);

  const recent = values.slice(-3);
  const prior = values.slice(-6, -3);
  const recentAvg =
    recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  const priorAvg =
    prior.length > 0 ? prior.reduce((a, b) => a + b, 0) / prior.length : recentAvg;
  const deltaPct =
    priorAvg > 0 ? Math.round(((recentAvg - priorAvg) / priorAvg) * 100) : 0;

  let growthTrend: ForecastKpis["growthTrend"] = "flat";
  let growthLabel = "持平 →";
  if (deltaPct > 3) {
    growthTrend = "up";
    growthLabel = `微幅上升 ↗ +${deltaPct}%`;
  } else if (deltaPct < -3) {
    growthTrend = "down";
    growthLabel = `略為下滑 ↘ ${deltaPct}%`;
  }

  const modelNote = options.excludeOutliers
    ? "基於近 7 日 GA4 趨勢的線性外推（已排除極端值）"
    : "基於近 7 日 GA4 趨勢的線性外推";

  return {
    series: [...actualSeries, ...forecastSeries],
    forecastRows,
    kpis: {
      totalProjected,
      dailyAverage,
      growthLabel,
      growthTrend,
      modelNote,
    },
  };
}
