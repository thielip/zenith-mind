"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletterAction } from "@/actions/newsletter.actions";

interface Props {
  locale: string;
  source?: string;
  compact?: boolean;
}

export default function NewsletterSignup({
  locale,
  source = "homepage",
  compact = false,
}: Props) {
  const isEn = locale === "en";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setError(isEn ? "Please enter a valid email." : "請輸入有效的 Email。");
      return;
    }

    startTransition(async () => {
      const result = await subscribeNewsletterAction({
        email: normalizedEmail,
        locale: isEn ? "en" : "zh-TW",
        source,
      });

      if (!result.success) {
        setError(
          result.error.code === "VALIDATION_ERROR"
            ? (isEn ? "Please enter a valid email." : "請輸入有效的 Email。")
            : (isEn ? "Subscription failed. Please try again later." : "訂閱失敗，請稍後再試。")
        );
        return;
      }

      setEmail("");
      setMessage(
        result.data.alreadySubscribed
          ? (isEn ? "You are already subscribed." : "你已經訂閱過了。")
          : (isEn ? "Subscribed. Welcome to Zenith Mind." : "訂閱成功，歡迎加入巔峰思維。")
      );
    });
  }

  return (
    <form
      id={`newsletter-${source}`}
      onSubmit={onSubmit}
      className={compact ? "space-y-3" : "mx-auto max-w-xl space-y-4"}
      noValidate
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`newsletter-email-${source}`} className="sr-only">
          Email
        </label>
        <input
          id={`newsletter-email-${source}`}
          type="email"
          value={email}
          inputMode="email"
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder={isEn ? "Enter your email" : "輸入你的 Email"}
          className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {isPending
            ? (isEn ? "Subscribing..." : "訂閱中...")
            : (isEn ? "Subscribe" : "訂閱電子報")}
        </button>
      </div>
      <p className="text-xs text-gray-500">
        {isEn
          ? "Free SEO, AI, investing and personal brand insights. No spam."
          : "免費接收 SEO、AI、投資理財與個人品牌策略。拒絕垃圾信。"}
      </p>
      {message && <p className="text-sm font-medium text-green-700">{message}</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}
