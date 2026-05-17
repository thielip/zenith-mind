"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { GlassCard } from "@/shared/ui/glass-card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import {
  activateIntegrationAction,
  disconnectIntegrationAction,
  saveIntegrationAction,
} from "@/features/integrations-hub/actions/integration-actions";

type RowStatus = {
  provider: string;
  status: string;
  lastError: string | null;
  lastVerifiedAt: Date | null;
};

interface Props {
  rows: RowStatus[];
  initialValues: Partial<Record<IntegrationProviderId, Record<string, string>>>;
}

const statusLabel: Record<string, { text: string; variant: "ok" | "error" | "default" | "warn" }> = {
  CONNECTED: { text: "已啟動", variant: "ok" },
  ERROR: { text: "異常", variant: "error" },
  DISCONNECTED: { text: "未啟動", variant: "default" },
};

export function IntegrationsHubView({ rows, initialValues }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<IntegrationProviderId>("ga4");
  const [form, setForm] = useState<Record<string, string>>(
    initialValues[activeId] ?? {}
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setForm(initialValues[activeId] ?? {});
  }, [initialValues, activeId]);

  const def = INTEGRATION_PROVIDERS.find((p) => p.id === activeId)!;
  const row = rows.find((r) => r.provider === activeId);
  const badge = statusLabel[row?.status ?? "DISCONNECTED"] ?? statusLabel.DISCONNECTED;

  function switchProvider(id: IntegrationProviderId) {
    setActiveId(id);
    setForm(initialValues[id] ?? {});
    setMessage(null);
  }

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function run(
    action: "save" | "activate" | "disconnect"
  ) {
    startTransition(async () => {
      setMessage(null);
      const result =
        action === "save"
          ? await saveIntegrationAction(activeId, form)
          : action === "activate"
            ? await activateIntegrationAction(activeId, form)
            : await disconnectIntegrationAction(activeId);
      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="外部串接設定"
        description="在此填寫各平台帳號與金鑰，儲存後按「啟動連線」將自動驗證並套用到作戰中心（加密儲存於資料庫）。"
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <GlassCard className="p-2">
          <ul className="space-y-0.5">
            {INTEGRATION_PROVIDERS.map((p) => {
              const st = rows.find((r) => r.provider === p.id);
              const lbl = statusLabel[st?.status ?? "DISCONNECTED"];
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => switchProvider(p.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      activeId === p.id
                        ? "bg-cyan-500/15 text-cyan-100"
                        : "text-slate-400 hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="block font-medium">{p.name}</span>
                    <span className="text-xs text-slate-500">{lbl?.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{def.name}</h2>
            <Badge variant={badge?.variant ?? "default"}>{badge?.text}</Badge>
          </div>
          <p className="mb-6 text-sm text-slate-400">{def.description}</p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run("activate");
            }}
          >
            {def.fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block text-xs text-slate-400">{field.label}</span>
                {field.secret ? (
                  <textarea
                    rows={field.key.includes("PRIVATE_KEY") ? 4 : 2}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 font-mono text-xs text-slate-100"
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    autoComplete="off"
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    autoComplete="off"
                  />
                )}
              </label>
            ))}

            {message ? (
              <p
                className={`text-sm ${message.includes("失敗") || message.includes("缺少") ? "text-red-400" : "text-emerald-400"}`}
              >
                {message}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => run("save")}>
                儲存草稿
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "驗證中…" : "啟動連線"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => run("disconnect")}
              >
                停用
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
