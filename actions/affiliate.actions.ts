// actions/affiliate.actions.ts — Node Runtime
// 聯盟連結 CRUD Server Actions

"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/infrastructure/db/prisma";
import { gateAdminWrite } from "@/lib/auth/resolve-admin-action";
import { getRequestMeta } from "@/lib/request/request-meta";
import { sanitizeText } from "@/lib/sanitize/html";
import { writeAuditLog } from "@/infrastructure/db/adapters/audit.prisma-adapter";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

interface AffiliateLinkData {
  id:         string;
  name:       string;
  slug:       string;
  targetUrl:  string;
  platform:   string;
  commission: string;
  isActive:   boolean;
  clickCount: number;
}

const createSchema = z.object({
  name:       z.string().min(1).max(100),
  slug:       z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  targetUrl:  z.string().url(),
  platform:   z.string().max(50).optional(),
  commission: z.string().max(50).optional(),
});

const updateSchema = z.object({
  id:         z.string().cuid(),
  name:       z.string().min(1).max(100),
  targetUrl:  z.string().url(),
  platform:   z.string().max(50).optional(),
  commission: z.string().max(50).optional(),
  isActive:   z.boolean(),
});

// ── 新增 ──────────────────────────────────────────────────

export async function createAffiliateLinkAction(
  input: unknown
): Promise<ActionResult<AffiliateLinkData>> {
  const meta = await getRequestMeta();

  try {
    const gate = await gateAdminWrite("affiliate");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const d = parsed.data;

    const existing = await prisma.affiliateLink.findUnique({
      where: { slug: d.slug },
    });
    if (existing) {
      return { success: false, data: null, error: Errors.duplicate("slug") };
    }

    const link = await prisma.affiliateLink.create({
      data: {
        name:       sanitizeText(d.name),
        slug:       sanitizeText(d.slug),
        targetUrl:  d.targetUrl,
        platform:   d.platform ? sanitizeText(d.platform) : null,
        commission: d.commission ? sanitizeText(d.commission) : null,
      },
    });

    void writeAuditLog({
      action:     "CREATE",
      entityType: "AffiliateLink",
      entityId:   link.id,
      userId:     admin.userId,
      ...meta,
    });

    revalidateTag("affiliate-links");
    revalidatePath("/zh-TW");
    revalidatePath("/en");
    revalidatePath("/", "layout");

    return {
      success: true,
      error:   null,
      data: {
        id:         link.id,
        name:       link.name,
        slug:       link.slug,
        targetUrl:  link.targetUrl,
        platform:   link.platform ?? "",
        commission: link.commission ?? "",
        isActive:   link.isActive,
        clickCount: link.clickCount,
      },
    };

  } catch (e: unknown) {
    console.error(`[Affiliate] create error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

// ── 更新 ──────────────────────────────────────────────────

export async function updateAffiliateLinkAction(
  input: unknown
): Promise<ActionResult<AffiliateLinkData>> {
  const meta = await getRequestMeta();

  try {
    const gate = await gateAdminWrite("affiliate");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const d = parsed.data;

    const link = await prisma.affiliateLink.update({
      where: { id: d.id },
      data: {
        name:       sanitizeText(d.name),
        targetUrl:  d.targetUrl,
        platform:   d.platform ? sanitizeText(d.platform) : null,
        commission: d.commission ? sanitizeText(d.commission) : null,
        isActive:   d.isActive,
      },
    });

    void writeAuditLog({
      action:     "UPDATE",
      entityType: "AffiliateLink",
      entityId:   link.id,
      userId:     admin.userId,
      ...meta,
    });

    revalidateTag("affiliate-links");
    revalidatePath("/zh-TW");
    revalidatePath("/en");
    revalidatePath("/", "layout");

    return {
      success: true,
      error:   null,
      data: {
        id:         link.id,
        name:       link.name,
        slug:       link.slug,
        targetUrl:  link.targetUrl,
        platform:   link.platform ?? "",
        commission: link.commission ?? "",
        isActive:   link.isActive,
        clickCount: link.clickCount,
      },
    };
  } catch (e: unknown) {
    console.error(`[Affiliate] update error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

// ── 列表快速切換啟用狀態 ────────────────────────────────────

export async function toggleAffiliateLinkActiveAction(
  id: unknown,
  isActive: unknown
): Promise<ActionResult<AffiliateLinkData>> {
  const meta = await getRequestMeta();

  try {
    const gate = await gateAdminWrite("affiliate");
    if (!gate.ok) return gate.result;

    const parsedId = z.string().cuid().safeParse(id);
    const parsedActive = z.boolean().safeParse(isActive);
    if (!parsedId.success || !parsedActive.success) {
      return { success: false, data: null, error: Errors.validation() };
    }

    const link = await prisma.affiliateLink.update({
      where: { id: parsedId.data },
      data: { isActive: parsedActive.data },
    });

    revalidateTag("affiliate-links");
    revalidatePath("/zh-TW");
    revalidatePath("/en");
    revalidatePath("/", "layout");

    return {
      success: true,
      error: null,
      data: {
        id: link.id,
        name: link.name,
        slug: link.slug,
        targetUrl: link.targetUrl,
        platform: link.platform ?? "",
        commission: link.commission ?? "",
        isActive: link.isActive,
        clickCount: link.clickCount,
      },
    };
  } catch (e: unknown) {
    console.error(`[Affiliate] toggle active error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

// ── 刪除 ──────────────────────────────────────────────────

export async function deleteAffiliateLinkAction(
  id: unknown
): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();

  try {
    const gate = await gateAdminWrite("affiliate");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

    const parsed = z.string().cuid().safeParse(id);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation() };
    }

    await prisma.affiliateLink.delete({ where: { id: parsed.data } });

    void writeAuditLog({
      action:     "DELETE",
      entityType: "AffiliateLink",
      entityId:   parsed.data,
      userId:     admin.userId,
      ...meta,
    });

    revalidateTag("affiliate-links");
    revalidatePath("/zh-TW");
    revalidatePath("/en");
    revalidatePath("/", "layout");

    return { success: true, data: undefined, error: null };

  } catch (e: unknown) {
    console.error(`[Affiliate] delete error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}
