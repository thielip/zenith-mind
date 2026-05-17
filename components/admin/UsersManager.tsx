"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changePasswordAction,
  createUserAction,
  deleteUserAction,
} from "@/actions/user.actions";

export interface UserListItem {
  id: string;
  email: string;
  role: string;
  totpEnabled: boolean;
  createdAt: string;
}

interface Props {
  users: UserListItem[];
  currentUserId: string;
}

export function UsersManager({ users, currentUserId }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  function createUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await createUserAction({ email, password });
      if (!result.success) {
        setMessage(
          result.error.code === "DUPLICATE_ERROR"
            ? "此 Email 已存在"
            : "新增失敗"
        );
        return;
      }
      setEmail("");
      setPassword("");
      setMessage(`已新增使用者：${result.data.email}`);
      router.refresh();
    });
  }

  function resetPasswordFor(userId: string) {
    if (!resetPassword || resetPassword.length < 8) {
      setMessage("新密碼至少 8 字元");
      return;
    }
    startTransition(async () => {
      const result = await changePasswordAction({
        userId,
        newPassword: resetPassword,
      });
      if (!result.success) {
        setMessage("重設密碼失敗");
        return;
      }
      setResetUserId(null);
      setResetPassword("");
      setMessage("已重設該使用者密碼");
    });
  }

  function removeUser(userId: string) {
    if (!confirm("確定要停用此使用者？")) return;
    startTransition(async () => {
      const result = await deleteUserAction(userId);
      if (!result.success) {
        setMessage(
          result.error.code === "LAST_ADMIN"
            ? "至少需保留一位管理員"
            : "無法刪除"
        );
        return;
      }
      setMessage("已停用使用者");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">新增管理員</h2>
        <p className="mt-1 text-sm text-gray-500">
          帳號儲存於資料庫（bcrypt 雜湊），可在後台隨時變更密碼。
        </p>
        <form onSubmit={createUser} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">密碼</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? "處理中…" : "新增使用者"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">使用者列表</h2>
        <ul className="mt-4 divide-y divide-gray-100">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">
                  {user.email}
                  {user.id === currentUserId ? (
                    <span className="ml-2 text-xs text-blue-600">（目前登入）</span>
                  ) : null}
                </p>
                <p className="text-xs text-gray-500">
                  {user.role} · 2FA {user.totpEnabled ? "已啟用" : "未啟用"} ·{" "}
                  {new Date(user.createdAt).toLocaleDateString("zh-TW")}
                </p>
              </div>
              {user.id !== currentUserId ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetUserId(user.id);
                      setResetPassword("");
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    重設密碼
                  </button>
                  <button
                    type="button"
                    onClick={() => removeUser(user.id)}
                    disabled={pending}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    停用
                  </button>
                </div>
              ) : null}
              {resetUserId === user.id ? (
                <div className="flex w-full flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
                  <label className="block flex-1 text-sm">
                    <span className="text-gray-600">新密碼</span>
                    <input
                      type="password"
                      minLength={8}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => resetPasswordFor(user.id)}
                    disabled={pending}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
                  >
                    確認重設
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetUserId(null)}
                    className="rounded-lg border px-3 py-2 text-sm text-gray-600"
                  >
                    取消
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {message ? (
        <p
          role="status"
          className={`text-sm ${message.includes("失敗") || message.includes("無法") ? "text-red-600" : "text-emerald-600"}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
