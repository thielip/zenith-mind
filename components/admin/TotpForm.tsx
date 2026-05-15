// components/admin/TotpForm.tsx — Client Component
// 6 位數 TOTP 輸入（每格一個 input，UX 最佳化）

"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { verifyTotpAction } from "@/actions/auth.actions";

export default function TotpForm() {
  const router     = useRouter();
  const [digits,   setDigits]   = useState<string[]>(Array(6).fill(""));
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRefs  = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  function handleChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next  = [...digits];
    next[idx]   = digit;
    setDigits(next);

    // 自動跳至下一格
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }

    // 六格填滿自動送出
    if (next.every((d) => d !== "") && next.join("").length === 6) {
      void submit(next.join(""));
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  async function submit(code: string) {
    setErrorMsg("");
    startTransition(async () => {
      const result = await verifyTotpAction({ code });
      if (result.success) {
        router.push("/admin/dashboard");
      } else {
        setErrorMsg(
          result.error.code === "TOTP_INVALID"
            ? "驗證碼錯誤，請重新輸入"
            : "驗證失敗，請稍後再試"
        );
        setDigits(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-blue-50 p-4">
          <ShieldCheck size={28} className="text-blue-600" aria-hidden="true" />
        </div>
      </div>

      {/* 6 格輸入 */}
      <div
        role="group"
        aria-label="驗證碼輸入"
        className="flex justify-center gap-2"
      >
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={isPending}
            aria-label={`驗證碼第 ${idx + 1} 位`}
            className={[
              "h-12 w-11 rounded-xl border text-center text-xl font-bold",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
              d ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-900",
              isPending ? "opacity-50" : "",
            ].join(" ")}
          />
        ))}
      </div>

      {errorMsg && (
        <p
          role="alert"
          aria-live="assertive"
          className="mt-4 text-center text-sm text-red-600"
        >
          {errorMsg}
        </p>
      )}

      {isPending && (
        <p className="mt-4 text-center text-sm text-gray-400" aria-live="polite">
          驗證中…
        </p>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        打開你的 Authenticator App（如 Google Authenticator），輸入顯示的 6 位數驗證碼。
      </p>
    </div>
  );
}
