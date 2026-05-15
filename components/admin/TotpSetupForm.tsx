// components/admin/TotpSetupForm.tsx — Client Component
// TOTP 初始設定：顯示 QR Code → 使用者掃描 → 輸入驗證碼確認

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { activateTotpAction } from "@/actions/totp-activate.actions";

interface Props {
  qrCodeUrl:       string; // data:image/png;base64,...
  base32:          string; // 手動輸入用的 secret
  encryptedSecret: string; // AES-256 加密，Server Action 使用
  userId:          string;
}

export default function TotpSetupForm({
  qrCodeUrl, base32, encryptedSecret, userId,
}: Props) {
  const router      = useRouter();
  const [code,      setCode]      = useState("");
  const [copied,    setCopied]    = useState(false);
  const [errorMsg,  setErrorMsg]  = useState("");
  const [isPending, startTransition] = useTransition();

  async function copySecret() {
    await navigator.clipboard.writeText(base32);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setErrorMsg("");

    startTransition(async () => {
      const result = await activateTotpAction({
        userId,
        encryptedSecret,
        code,
      });

      if (result.success) {
        router.push("/admin/settings?totp=activated");
        router.refresh();
      } else {
        setErrorMsg(
          result.error.code === "TOTP_INVALID"
            ? "驗證碼錯誤，請確認 App 時間正確後重試"
            : result.error.code === "AUTH_FAILED"
              ? "登入狀態已失效，請重新登入後再設定 2FA"
            : "設定失敗，請重新整理頁面再試"
        );
        setCode("");
      }
    });
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-8 space-y-8">
      {/* Step 1：掃描 QR Code */}
      <section aria-labelledby="qr-step">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white" aria-hidden="true">1</span>
          <h2 id="qr-step" className="text-sm font-semibold text-gray-900">
            使用 Authenticator App 掃描 QR Code
          </h2>
        </div>
        <div className="flex flex-col items-center gap-4">
          {/* QR Code 圖片 */}
          <div className="rounded-xl border border-gray-200 p-3 bg-white">
            <Image
              src={qrCodeUrl}
              alt="TOTP QR Code，請使用 Google Authenticator 或其他相容 App 掃描"
              width={200}
              height={200}
              loading="eager"
              unoptimized // data URL 不需要優化
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            推薦使用：Google Authenticator、Authy、1Password
          </p>
        </div>
      </section>

      {/* Step 2：手動輸入金鑰（備用）*/}
      <section aria-labelledby="manual-step">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600" aria-hidden="true">2</span>
          <h2 id="manual-step" className="text-sm font-semibold text-gray-900">
            或手動輸入金鑰（無法掃描時使用）
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
          <code className="flex-1 text-xs font-mono text-gray-700 break-all">
            {base32}
          </code>
          <button
            type="button"
            onClick={copySecret}
            aria-label="複製金鑰"
            className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {copied
              ? <Check size={14} className="text-green-600" aria-hidden="true" />
              : <Copy size={14} aria-hidden="true" />
            }
          </button>
        </div>
      </section>

      {/* Step 3：輸入驗證碼確認 */}
      <section aria-labelledby="verify-step">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600" aria-hidden="true">3</span>
          <h2 id="verify-step" className="text-sm font-semibold text-gray-900">
            輸入 App 顯示的 6 位數驗證碼
          </h2>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex gap-3">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              placeholder="000000"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-2xl font-mono tracking-widest focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="6 位數驗證碼"
              aria-required="true"
              aria-describedby={errorMsg ? "totp-setup-err" : undefined}
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={code.length !== 6 || isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <ShieldCheck size={16} aria-hidden="true" />
              {isPending ? "驗證中…" : "啟用 2FA"}
            </button>
          </div>

          {errorMsg && (
            <p
              id="totp-setup-err"
              role="alert"
              aria-live="assertive"
              className="mt-2 text-sm text-red-600"
            >
              {errorMsg}
            </p>
          )}
        </form>
      </section>
    </article>
  );
}
