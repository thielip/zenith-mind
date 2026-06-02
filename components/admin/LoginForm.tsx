// components/admin/LoginForm.tsx — Client Component

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginAction } from "@/actions/auth.actions";
import {
  loginErrorMessage,
  safeRedirectPath,
} from "@/components/admin/login-form-utils";
import {
  getAdminEmailHint,
  persistAdminSessionHint,
} from "@/lib/auth/client-session";

const schema = z.object({
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(8, "密碼至少 8 字元"),
});
type FormValues = z.infer<typeof schema>;

export type LoginFormProps = {
  redirect?: string;
  reason?: string | null;
};

export default function LoginForm({
  redirect: redirectProp,
  reason,
}: LoginFormProps) {
  const router = useRouter();
  const redirect = safeRedirectPath(redirectProp);

  const [showPw, setShowPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
    });

  useEffect(() => {
    const emailHint = getAdminEmailHint();
    if (emailHint) setValue("email", emailHint);
  }, [setValue]);

  const onSubmit = handleSubmit((values) => {
    setErrorMsg("");
    startTransition(async () => {
      const normalizedEmail = values.email.trim().toLowerCase();
      const result = await loginAction({
        ...values,
        email: normalizedEmail,
      });

      if (!result.success) {
        setErrorMsg(loginErrorMessage(result.error?.code));
        return;
      }

      if (result.data.requireTotp) {
        persistAdminSessionHint(normalizedEmail);
        router.push("/admin/totp");
      } else {
        persistAdminSessionHint(normalizedEmail);
        router.push(redirect);
      }
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-5"
      noValidate
      aria-label="Admin 登入表單"
    >
      {(reason === "session_expired" || reason === "idle_timeout") && (
        <div
          role="alert"
          className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800"
        >
          {reason === "idle_timeout"
            ? "閒置超過 1 小時，請重新登入。"
            : "工作階段已逾時，請重新登入。"}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Mail size={15} className="text-gray-400" aria-hidden="true" />
          </span>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-required="true"
            aria-describedby={errors.email ? "email-err" : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-err" role="alert" className="mt-1 text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
          密碼
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Lock size={15} className="text-gray-400" aria-hidden="true" />
          </span>
          <input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            {...register("password")}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-required="true"
            aria-describedby={errors.password ? "pw-err" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={showPw ? "隱藏密碼" : "顯示密碼"}
          >
            {showPw ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          </button>
        </div>
        {errors.password && (
          <p id="pw-err" role="alert" className="mt-1 text-xs text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {errorMsg && (
        <p role="alert" className="text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      >
        {isPending ? "登入中…" : "登入"}
      </button>
    </form>
  );
}
