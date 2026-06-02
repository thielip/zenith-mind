// infrastructure/ai/openai.adapter.ts — Node Runtime Only
// AiPort 實作：透過 Gemini OpenAI 相容端點（原生 fetch）
// ⚠ GEMINI_API_KEY 絕不可 NEXT_PUBLIC_

import {
  createGeminiChatCompletionStream,
  GeminiApiError,
} from "@/lib/ai/gemini-compat-api";
import {
  GEMINI_FLASH_LITE_MODEL,
  getGeminiOpenAIClientFromEnv,
  getGeminiOpenAIClient,
} from "@/lib/ai/gemini-openai-client";
import type { AiPort, AiPromptOptions, AiResponse } from "@/domain/ai/ai.port";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

export class OpenAiAdapter implements AiPort {
  async generate(
    prompt: string,
    options?: AiPromptOptions
  ): Promise<ActionResult<AiResponse>> {
    try {
      const client = getGeminiOpenAIClient();

      const response = await client.chat.completions.create({
        model: GEMINI_FLASH_LITE_MODEL,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        messages: [{ role: "user", content: prompt }],
        ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        return { success: false, data: null, error: Errors.aiFormat() };
      }

      return {
        success: true,
        data: {
          text: choice.message.content,
          model: response.model,
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        error: null,
      };
    } catch (e: unknown) {
      if (e instanceof GeminiApiError) {
        if (e.status === 429) return { success: false, data: null, error: Errors.aiRateLimit() };
        if (e.status === 504) return { success: false, data: null, error: Errors.aiTimeout() };
      }
      console.error("[OpenAI] generate error:", e);
      return { success: false, data: null, error: Errors.internal() };
    }
  }

  async *stream(prompt: string, options?: AiPromptOptions): AsyncIterable<string> {
    const client = getGeminiOpenAIClientFromEnv();
    if (!client) {
      throw new Error("GEMINI_API_KEY 未設定");
    }
    const apiKey = process.env["GEMINI_API_KEY"]?.trim();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY 未設定");
    }
    for await (const chunk of createGeminiChatCompletionStream(apiKey, {
      model: GEMINI_FLASH_LITE_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
    })) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}

export const openAiAdapter = new OpenAiAdapter();
