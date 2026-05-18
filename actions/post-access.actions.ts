"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/infrastructure/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  hasPostAccess,
  postUnlockCookieOptions,
  signPostUnlockToken,
} from "@/lib/blog/post-access-cookie";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

const schema = z.object({
  slug: z.string().min(1).max(200),
  password: z.string().min(1).max(128),
});

export async function verifyPostPasswordAction(
  input: unknown
): Promise<ActionResult<{ unlocked: boolean }>> {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation() };
    }

    const { slug, password } = parsed.data;
    const post = await prisma.post.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        deletedAt: null,
        isPasswordProtected: true,
      },
      select: { id: true, accessPasswordHash: true },
    });

    if (!post?.accessPasswordHash) {
      return { success: false, data: null, error: Errors.notFound() };
    }

    const ok = await verifyPassword(password, post.accessPasswordHash);
    if (!ok) {
      return { success: false, data: null, error: Errors.auth() };
    }

    const token = signPostUnlockToken(slug, post.id);
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
    console.error("[PostAccess] verify failed:", e);
    return { success: false, data: null, error: Errors.internal() };
  }
}

export async function checkPostAccessAction(
  slug: string,
  postId: string
): Promise<boolean> {
  return hasPostAccess(slug, postId);
}
