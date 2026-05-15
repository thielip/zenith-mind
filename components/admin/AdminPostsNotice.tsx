"use client";

import { useEffect, useState } from "react";

export default function AdminPostsNotice() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("admin-posts-message");
    if (!stored) return;
    sessionStorage.removeItem("admin-posts-message");
    setMessage(stored);
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!message) return null;

  return (
    <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
      {message}
    </p>
  );
}
