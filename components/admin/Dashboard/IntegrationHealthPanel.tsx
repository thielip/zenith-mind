import type {
  IntegrationHealthItem,
  IntegrationHealthReport,
} from "@/lib/admin/integration-health.types";

const STATUS_LABEL = {
  ok: "正常",
  missing: "待設定",
  error: "連線失敗",
} as const;

const STATUS_CLASS = {
  ok: "bg-green-100 text-green-800",
  missing: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
} as const;

function HealthCard({ item }: { item: IntegrationHealthItem }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            STATUS_CLASS[item.status],
          ].join(" ")}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
      {item.detail ? (
        <p className="mt-2 text-xs text-gray-500">{item.detail}</p>
      ) : null}
      {item.missing.length > 0 ? (
        <p className="mt-2 break-all text-xs text-gray-400">
          缺少：{item.missing.join(", ")}
        </p>
      ) : null}
    </article>
  );
}

export default function IntegrationHealthPanel({
  report,
}: {
  report: IntegrationHealthReport;
}) {
  const checkedAt = new Date(report.checkedAt).toLocaleString("zh-TW");
  const { ok, missing, error } = report.summary;

  return (
    <section
      aria-labelledby="integration-health-heading"
      className="mt-8 rounded-xl border border-gray-200 bg-white p-6"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="integration-health-heading" className="text-base font-semibold text-gray-900">
          系統串接健康檢查
        </h2>
        <p className="text-xs text-gray-500">
          檢查時間：{checkedAt} · 正常 {ok} · 待設定 {missing} · 失敗 {error}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {report.items.map((item) => (
          <HealthCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
