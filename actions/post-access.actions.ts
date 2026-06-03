"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { withPublicReadBackend } from "@/lib/public-content/runtime";
import { fetchProtectedPostHashBySlug } from "@/lib/blog/post-access-supabase";
import { verifyPassword } from "@/lib/auth/password";
import {
  hasPostAccess,
  postUnlockCookieOptions,
  signPostUnlockToken,
} from "@/lib/blog/post-access-cookie";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";
import { getRequestMeta } from "@/lib/request/request-meta";
import {
  assertPostPasswordAttemptAllowed,
  delayAfterPostPasswordFailure,
} from "@/lib/security/post-password-guard";

const schema = z.object({
  slug: z.string().min(1).max(200),
  password: z.string().min(1).max(128),
});

export async function verifyPostPasswordAction(
  input: unknown
): Promise<ActionResult<{ unlocked: boolean }>> {
  const meta = await getRequestMeta();

  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation() };
    }

    const { slug, password } = parsed.data;

    const attempt = await assertPostPasswordAttemptAllowed(slug, meta.ip);
    if (!attempt.allowed) {
      return { success: false, data: null, error: Errors.rateLimit() };
    }

    const post = await withPublicReadBackend(
      () => fetchProtectedPostHashBySlug(slug),
      async () => {
        const { prisma } = await import("@/infrastructure/db/prisma");
        return prisma.post.findFirst({
          where: {
            slug,
            status: "PUBLISHED",
            deletedAt: null,
            isPasswordProtected: true,
          },
          select: { id: true, accessPasswordHash: true },
        });
      }
    );

    if (!post?.accessPasswordHash) {
      return { success: false, data: null, error: Errors.notFound() };
    }

    const ok = await verifyPassword(password, post.accessPasswordHash);
    if (!ok) {
      await delayAfterPostPasswordFailure(slug, meta.ip);
      return { success: false, data: null, error: Errors.auth() };
    }

    const token = await signPostUnlockToken(slug, post.id);
    const jar = await cookies();
    const opts = postUnlockCookieOptions(slug, token);
    jar.set(opts.name, opts.value, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });

    return { success: true, data: { unlocked: true }, error: null };
  } catch (e: unknown) {
    console.error(`[PostAccess] verify failed [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

export async function checkPostAccessAction(
  slug: string,
  postId: string
): Promise<boolean> {
  return hasPostAccess(slug, postId);
}
