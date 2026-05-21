/**
 * 共用 Gemini OpenAI 相容客戶端（openai npm 套件僅作 HTTP 適配，非 OpenAI API）。
 * API Key 僅能來自 GEMINI_API_KEY（server-only）。
 */
import OpenAI from "openai";
import { env } from "@/env";

export const GEMINI_COMPAT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";

export const GEMINI_FLASH_LITE_MODEL = "gemini-3.1-flash-lite-preview" as const;

let _client: OpenAI | null = null;

export function getGeminiOpenAIClient(): OpenAI {
  _client ??= new OpenAI({
    apiKey: env.GEMINI_API_KEY,
    baseURL: GEMINI_COMPAT_BASE_URL,
  });
  return _client;
}

/** 健康檢查等僅需 process.env 的場景（避免觸發完整 t3-env） */
export function getGeminiOpenAIClientFromEnv(): OpenAI | null {
  const apiKey = process.env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: GEMINI_COMPAT_BASE_URL,
  });
}
