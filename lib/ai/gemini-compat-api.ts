/**
 * Gemini OpenAI 相容 REST API（原生 fetch，避免 openai 套件內 node-fetch 的 url.parse 棄用警告）
 */
export const GEMINI_COMPAT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";

export class GeminiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = "GeminiApiError";
  }
}

export interface GeminiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GeminiChatCompletionParams {
  model: string;
  messages: GeminiChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: "json_object" };
}

export interface GeminiChatCompletion {
  model: string;
  choices: Array<{
    message?: { content?: string | null };
    delta?: { content?: string | null };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function apiUrl(path: string) {
  const base = GEMINI_COMPAT_BASE_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function geminiFetch<T>(
  path: string,
  apiKey: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }
  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error?: { message?: string } }).error?.message === "string"
        ? (json as { error: { message: string } }).error.message
        : `Gemini API HTTP ${res.status}`;
    throw new GeminiApiError(msg, res.status, json);
  }
  return json as T;
}

export async function listGeminiModels(apiKey: string) {
  return geminiFetch<{ data?: Array<{ id?: string }> }>("/models", apiKey, {
    method: "GET",
  });
}

export async function createGeminiChatCompletion(
  apiKey: string,
  params: GeminiChatCompletionParams
): Promise<GeminiChatCompletion> {
  if (params.stream) {
    throw new Error("Use createGeminiChatCompletionStream for stream=true");
  }
  return geminiFetch<GeminiChatCompletion>("/chat/completions", apiKey, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function* createGeminiChatCompletionStream(
  apiKey: string,
  params: Omit<GeminiChatCompletionParams, "stream">
): AsyncGenerator<GeminiChatCompletion> {
  const res = await fetch(apiUrl("/chat/completions"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...params, stream: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new GeminiApiError(`Gemini stream HTTP ${res.status}`, res.status, text);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Gemini stream: no body");

  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        yield JSON.parse(payload) as GeminiChatCompletion;
      } catch {
        /* skip malformed chunk */
      }
    }
  }
}
