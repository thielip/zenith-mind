"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { verifyPostPasswordAction } from "@/actions/post-access.actions";

interface Props {
  slug: string;
  locale: string;
}

export default function PostPasswordGate({ slug, locale }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await verifyPostPasswordAction({ slug, password });
      if (result.success) {
        window.location.reload();
        return;
      }
      setError(
        locale === "en"
          ? "Incorrect password. Please try again."
          : "密碼錯誤，請再試一次。"
      );
    });
  };

  return (
    <section
      className="my-10 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center"
      aria-labelledby="post-password-heading"
    >
      <Lock className="mx-auto mb-4 text-gray-400" size={32} aria-hidden />
      <h2 id="post-password-heading" className="text-lg font-semibold text-gray-900">
        {locale === "en" ? "Password protected article" : "此文章已加密"}
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        {locale === "en"
          ? "Enter the password to read the full content."
          : "請輸入文章密碼以閱讀完整內容。"}
      </p>
      <form onSubmit={onSubmit} className="mx-auto mt-6 max-w-sm space-y-3">
        <label htmlFor="post-access-password" className="sr-only">
          {locale === "en" ? "Article password" : "文章密碼"}
        </label>
        <input
          id="post-access-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          autoComplete="current-password"
          required
        />
        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending
            ? locale === "en"
              ? "Verifying…"
              : "驗證中…"
            : locale === "en"
              ? "Unlock"
              : "解鎖閱讀"}
        </button>
      </form>
    </section>
  );
}
