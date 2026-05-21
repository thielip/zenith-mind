"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequestMeta } from "@/lib/request/request-meta";
import { prisma } from "@/infrastructure/db/prisma";
import { writeAuditLog } from "@/infrastructure/db/adapters/audit.prisma-adapter";
import { deleteSiteAssetByPublicUrl } from "@/infrastructure/storage/supabase-storage";
import { gateAdminWrite } from "@/lib/auth/resolve-admin-action";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

const mediaSourceSchema = z.enum(["logo", "hero", "carousel", "postCover"]);
const deleteMediaSchema = z.object({
  source: mediaSourceSchema,
  url: z.string().min(1).max(800),
  entityId: z.string().min(1).max(120).optional(),
});


function revalidateMediaPages() {
  revalidatePath("/admin/media");
  revalidatePath("/admin/site");
  revalidatePath("/zh-TW");
  revalidatePath("/en");
  revalidatePath("/", "layout");
}

export async function deleteMediaItemAction(input: unknown): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();

  try {
    const gate = await gateAdminWrite("media");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

    const parsed = deleteMediaSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const { source, url, entityId } = parsed.data;

    if (source === "logo") {
      await prisma.siteSettings.updateMany({
        where: { id: "site", logoUrl: url },
        data: { logoUrl: null },
      });
    }

    if (source === "hero") {
      if (!entityId) return { success: false, data: null, error: Errors.validation("Missing hero id") };
      await prisma.heroSlide.deleteMany({ where: { id: entityId, imageUrl: url } });
    }

    if (source === "carousel") {
      if (!entityId) return { success: false, data: null, error: Errors.validation("Missing carousel id") };
      await prisma.homeCarouselItem.deleteMany({ where: { id: entityId, imageUrl: url } });
    }

    if (source === "postCover") {
      if (!entityId) return { success: false, data: null, error: Errors.validation("Missing post id") };
      await prisma.post.updateMany({
        where: { id: entityId, coverImage: url },
        data: { coverImage: null, coverImageAlt: null },
      });
    }

    const storageResult = await deleteSiteAssetByPublicUrl(url).catch((error: unknown) => {
      console.error(`[Media] storage delete failed [${meta.requestId}]:`, error);
      return { deleted: false, reason: "STORAGE_ERROR" as const };
    });

    void writeAuditLog({
      action: "DELETE",
      entityType: "MediaAsset",
      entityId,
      metadata: { source, url, storageResult },
      userId: admin.userId,
      ...meta,
    });

    revalidateMediaPages();
    return { success: true, data: undefined, error: null };
  } catch (e: unknown) {
    console.error(`[Media] delete error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}
