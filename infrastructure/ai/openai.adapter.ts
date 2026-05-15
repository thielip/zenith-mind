// infrastructure/ai/openai.adapter.ts — Node Runtime Only
// AiPort 實作：透過 OpenAI SDK 呼叫 Gemini OpenAI 相容端點
// ⚠ GEMINI_API_KEY 絕不可 NEXT_PUBLIC_

import OpenAI from "openai";
import { env } from "@/env";
import type { AiPort, AiPromptOptions, AiResponse } from "@/domain/ai/ai.port";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

const GEMINI_COMPAT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";
const GEMINI_MODEL = "gemini-3.1-flash-lite-preview" as const;

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  _client ??= new OpenAI({
    apiKey:  env.GEMINI_API_KEY,
    baseURL: GEMINI_COMPAT_BASE_URL,
  });
  return _client;
}

export class OpenAiAdapter implements AiPort {

  async generate(
    prompt: string,
    options?: AiPromptOptions
  ): Promise<ActionResult<AiResponse>> {
    try {
      const client = getClient();

      const response = await client.chat.completions.create({
        model:       GEMINI_MODEL,
        temperature: options?.temperature ?? 0.7,
        max_tokens:  options?.maxTokens ?? 2000,
        messages:    [{ role: "user", content: prompt }],
        ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        return { success: false, data: null, error: Errors.aiFormat() };
      }

      return {
        success: true,
        data: {
          text:         choice.message.content,
          model:        response.model,
          inputTokens:  response.usage?.prompt_tokens    ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
          totalTokens:  response.usage?.total_tokens      ?? 0,
        },
        error: null,
      };

    } catch (e: unknown) {
      if (e instanceof OpenAI.APIError) {
        if (e.status === 429) return { success: false, data: null, error: Errors.aiRateLimit() };
        if (e.status === 504) return { success: false, data: null, error: Errors.aiTimeout() };
      }
      console.error("[OpenAI] generate error:", e);
      return { success: false, data: null, error: Errors.internal() };
    }
  }

  async *stream(prompt: string, options?: AiPromptOptions): AsyncIterable<string> {
    const client = getClient();
    const stream = await client.chat.completions.create({
      model:    GEMINI_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream:   true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}

export const openAiAdapter = new OpenAiAdapter();
