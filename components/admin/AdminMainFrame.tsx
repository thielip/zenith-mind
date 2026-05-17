"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";

export function AdminMainFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCommandCenter = pathname.startsWith("/admin/dashboard");

  return (
    <main
      id="admin-main"
      className={cn(
        "flex-1 overflow-y-auto p-6",
        isCommandCenter ? "bg-[#05070F]" : "bg-gray-100"
      )}
      tabIndex={-1}
    >
      {children}
    </main>
  );
}
