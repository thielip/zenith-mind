// app/admin/affiliate/page.tsx — 聯盟連結管理
// Cache 模式 B：force-dynamic

import type { Metadata } from "next";
import { prisma } from "@/infrastructure/db/prisma";
import AffiliateManager from "@/components/admin/AffiliateManager";

export const metadata: Metadata = { title: "聯盟連結 | Admin" };
export const dynamic = "force-dynamic";

export default async function AffiliatePage() {
  const links = await prisma.affiliateLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">聯盟連結管理</h1>
      <AffiliateManager
        initialLinks={links.map((l) => ({
          id:         l.id,
          name:       l.name,
          slug:       l.slug,
          targetUrl:  l.targetUrl,
          platform:   l.platform ?? "",
          commission: l.commission ?? "",
          isActive:   l.isActive,
          clickCount: l.clickCount,
        }))}
      />
    </div>
  );
}
