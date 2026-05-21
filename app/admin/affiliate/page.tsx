// app/admin/affiliate/page.tsx — 聯盟連結管理
// Cache 模式 B：force-dynamic

import type { Metadata } from "next";
import AffiliateManager from "@/components/admin/AffiliateManager";
import { loadAffiliateLinksForAdmin } from "@/lib/affiliate/load-affiliate-admin";

export const metadata: Metadata = { title: "聯盟連結 | Admin" };
export const dynamic = "force-dynamic";

export default async function AffiliatePage() {
  const initialLinks = await loadAffiliateLinksForAdmin();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">聯盟連結管理</h1>
      <AffiliateManager initialLinks={initialLinks} />
    </div>
  );
}
