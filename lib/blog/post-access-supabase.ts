import { getSupabaseRestConfig, supabaseRestWithFallback } from "@/lib/db/supabase-rest";

type ProtectedPostRow = {
  id: string;
  accessPasswordHash: string | null;
};

/** 需 SUPABASE_SERVICE_ROLE_KEY（Worker secret）；雜湊欄位不對 anon 開放 */
export async function fetchProtectedPostHashBySlug(
  slug: string
): Promise<{ id: string; accessPasswordHash: string } | null> {
  const cfg = getSupabaseRestConfig();
  if (!cfg) return null;

  const rows = await supabaseRestWithFallback<ProtectedPostRow[]>(
    "posts",
    {
      select: "id,accessPasswordHash",
      slug: `eq.${slug}`,
      status: "eq.PUBLISHED",
      deletedAt: "is.null",
      isPasswordProtected: "eq.true",
      limit: "1",
    },
    [],
    undefined,
    { kind: "fresh" }
  );

  const row = rows[0];
  if (!row?.accessPasswordHash) return null;
  return { id: row.id, accessPasswordHash: row.accessPasswordHash };
}
