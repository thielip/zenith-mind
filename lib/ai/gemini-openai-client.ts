/**
 * Gemini OpenAI 相容客戶端（fetch 實作，非 openai npm 套件）
 * API Key 僅能來自 GEMINI_API_KEY（server-only）。
 */
import { env } from "@/env";
import {
  createGeminiChatCompletion,
  createGeminiChatCompletionStream,
  listGeminiModels,
  GEMINI_COMPAT_BASE_URL,
  type GeminiChatCompletionParams,
  type GeminiChatCompletion,
} from "@/lib/ai/gemini-compat-api";

export { GEMINI_COMPAT_BASE_URL };

export const GEMINI_FLASH_LITE_MODEL = "gemini-3.1-flash-lite-preview" as const;

export interface GeminiCompatClient {
  chat: {
    completions: {
      create(
        params: GeminiChatCompletionParams
      ): Promise<GeminiChatCompletion>;
    };
  };
  models: {
    list(): Promise<{ data: Array<{ id?: string }> }>;
  };
}

function wrapClient(apiKey: string): GeminiCompatClient {
  return {
    chat: {
      completions: {
        create: (params) => {
          if (params.stream) {
            const { stream: _s, ...rest } = params;
            return createGeminiChatCompletionStream(
              apiKey,
              rest
            ) as unknown as Promise<GeminiChatCompletion>;
          }
          return createGeminiChatCompletion(apiKey, params);
        },
      },
    },
    models: {
      list: async () => {
        const res = await listGeminiModels(apiKey);
        return { data: res.data ?? [] };
      },
    },
  };
}

let _client: GeminiCompatClient | null = null;

export function getGeminiOpenAIClient(): GeminiCompatClient {
  _client ??= wrapClient(env.GEMINI_API_KEY);
  return _client;
}

/** 健康檢查等僅需 process.env 的場景（避免觸發完整 t3-env） */
export function getGeminiOpenAIClientFromEnv(): GeminiCompatClient | null {
  const apiKey = process.env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) return null;
  return wrapClient(apiKey);
}
