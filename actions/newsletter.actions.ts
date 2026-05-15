"use server";

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

const subscribeSchema = z.object({
  email:  z.string().trim().email().max(254),
  locale: z.enum(["zh-TW", "en"]).default("zh-TW"),
  source: z.string().max(80).default("homepage"),
});

export async function subscribeNewsletterAction(
  input: unknown
): Promise<ActionResult<{ email: string; alreadySubscribed: boolean }>> {
  try {
    const parsed = subscribeSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        data: null,
        error: Errors.validation(parsed.error.flatten()),
      };
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        locale: parsed.data.locale,
        source: parsed.data.source,
        status: "ACTIVE",
      },
      update: {
        locale: parsed.data.locale,
        source: parsed.data.source,
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      data: {
        email,
        alreadySubscribed: existing?.status === "ACTIVE",
      },
      error: null,
    };
  } catch (error) {
    console.error("[Newsletter] subscribe error:", error);
    return { success: false, data: null, error: Errors.internal() };
  }
}
