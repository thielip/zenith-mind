// components/admin/AiAssistant/AiJobTrigger.tsx — Client Component
// AI Job 觸發 + Polling UI（每 2 秒查詢狀態）
// 防重複：idempotencyKey = postId + type + timestamp（UI 連點安全）

"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BrainCircuit, Loader2, CheckCircle, XCircle } from "lucide-react";
import { fetchWithAuth } from "@/infrastructure/http/fetch.client";

interface Props {
  postId:        string;
  postTitle:     string;
  onDraftApply:  (draft: string) => void;
}

const triggerSchema = z.object({
  topic:          z.string().min(2, "主題至少 2 字").max(200),
  keywords:       z.string().min(2, "請輸入關鍵字，以逗號分隔"),
  targetAudience: z.string().max(200).optional(),
  wordCount:      z.number().int().min(500).max(5000).default(2000),
  locale:         z.enum(["zh-TW", "en"]).default("zh-TW"),
});

type TriggerInput = z.input<typeof triggerSchema>;
type TriggerForm = z.output<typeof triggerSchema>;

type JobStatus = "idle" | "pending" | "processing" | "done" | "failed" | "dead_letter";

interface JobResult {
  title:         string;
  content:       string;
  suggestedTags: string[];
}

export default function AiJobTrigger({ postId, postTitle, onDraftApply }: Props) {
  const [jobId,       setJobId]       = useState<string | null>(null);
  const [jobStatus,   setJobStatus]   = useState<JobStatus>("idle");
  const [jobResult,   setJobResult]   = useState<JobResult | null>(null);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [isPending,   startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<TriggerInput, unknown, TriggerForm>({
    resolver: zodResolver(triggerSchema),
    defaultValues: {
      topic:          postTitle,
      keywords:       "",
      targetAudience: "對 AI 工具和投資理財有興趣的台灣讀者",
      wordCount:      2000,
      locale:         "zh-TW",
    },
  });

  // ── Polling 邏輯 ──────────────────────────────────────

  useEffect(() => {
    if (!jobId || jobStatus === "done" || jobStatus === "failed" || jobStatus === "dead_letter") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetchWithAuth(`/api/ai/jobs/${jobId}`);
        const data = await res.json() as {
          status:  string;
          result?: JobResult;
          failedReason?: unknown;
        };

        const s = data.status.toLowerCase() as JobStatus;
        setJobStatus(s);

        if (s === "done" && data.result) {
          setJobResult(data.result);
          if (pollRef.current) clearInterval(pollRef.current);
        }
        if (s === "failed" || s === "dead_letter") {
          setErrorMsg("AI 生成失敗，請重試或調整參數。");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // 網路錯誤：繼續 polling，不中斷
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId, jobStatus]);

  // ── 送出 AI Job ───────────────────────────────────────

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      setJobStatus("pending");
      setJobResult(null);
      setErrorMsg("");

      // idempotencyKey：防止 UI 連點
      const idempotencyKey = `${postId}-GENERATE_DRAFT-${Date.now()}`;

      try {
        const res = await fetchWithAuth("/api/ai/jobs", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            version:        1,
            type:           "GENERATE_DRAFT",
            postId,
            idempotencyKey,
            options: {
              topic:          values.topic,
              keywords:       values.keywords.split(",").map((k: string) => k.trim()).filter(Boolean),
              targetAudience: values.targetAudience ?? "",
              wordCount:      values.wordCount,
              locale:         values.locale,
            },
          }),
        });

        const data = await res.json() as { success: boolean; jobId?: string; error?: string };

        if (data.success && data.jobId) {
          setJobId(data.jobId);
          setJobStatus("pending");
        } else {
          setJobStatus("failed");
          setErrorMsg(data.error ?? "無法建立 AI 任務");
        }
      } catch {
        setJobStatus("failed");
        setErrorMsg("網路錯誤，請重試");
      }
    });
  });

  // ── 套用草稿 ─────────────────────────────────────────

  function applyDraft() {
    if (!jobResult) return;
    onDraftApply(jobResult.content);
    setJobStatus("idle");
    setJobId(null);
    setJobResult(null);
  }

  // ── UI ────────────────────────────────────────────────

  const isRunning = jobStatus === "pending" || jobStatus === "processing";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BrainCircuit size={20} className="text-purple-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-gray-900">AI 草稿生成</h2>
      </div>

      {/* 表單 */}
      <form onSubmit={onSubmit} className="space-y-4" noValidate aria-label="AI 草稿生成設定">
        <div>
          <label htmlFor="ai-topic" className="mb-1.5 block text-sm font-medium text-gray-700">
            主題 <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="ai-topic"
            {...register("topic")}
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            aria-required="true"
            aria-describedby={errors.topic ? "ai-topic-err" : undefined}
          />
          {errors.topic && (
            <p id="ai-topic-err" role="alert" className="mt-1 text-xs text-red-600">
              {errors.topic.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ai-keywords" className="mb-1.5 block text-sm font-medium text-gray-700">
            目標關鍵字（逗號分隔）<span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="ai-keywords"
            {...register("keywords")}
            placeholder="例：AI 投資, ETF, 被動收入"
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ai-wordcount" className="mb-1.5 block text-sm font-medium text-gray-700">
              字數目標
            </label>
            <select
              id="ai-wordcount"
              {...register("wordCount", { valueAsNumber: true })}
              disabled={isRunning}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            >
              {[1000, 1500, 2000, 3000, 5000].map((n) => (
                <option key={n} value={n}>{n.toLocaleString()} 字</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ai-locale" className="mb-1.5 block text-sm font-medium text-gray-700">
              語言
            </label>
            <select
              id="ai-locale"
              {...register("locale")}
              disabled={isRunning}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isRunning || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
          aria-describedby="ai-status"
        >
          {isRunning ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              AI 生成中…
            </>
          ) : (
            <>
              <BrainCircuit size={16} aria-hidden="true" />
              開始生成草稿
            </>
          )}
        </button>
      </form>

      {/* 狀態顯示 */}
      <div id="ai-status" aria-live="polite" aria-atomic="true">
        {isRunning && (
          <div className="flex items-center gap-2 rounded-lg bg-purple-50 p-4 text-sm text-purple-700">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            <span>
              {jobStatus === "pending" ? "排隊等待中…" : "AI 正在撰寫，請稍候（約 30-60 秒）"}
            </span>
          </div>
        )}

        {jobStatus === "done" && jobResult && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={18} aria-hidden="true" />
              <span className="font-semibold">草稿生成完成！</span>
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-1">建議標題：</p>
              <p>{jobResult.title}</p>
            </div>
            {jobResult.suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-500">建議標籤：</span>
                {jobResult.suggestedTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={applyDraft}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              套用草稿至編輯器
            </button>
          </div>
        )}

        {(jobStatus === "failed" || jobStatus === "dead_letter") && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <XCircle size={16} aria-hidden="true" />
            <span>{errorMsg || "AI 生成失敗，請重試。"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
