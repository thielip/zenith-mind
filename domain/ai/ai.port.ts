// domain/ai/ai.port.ts
// AiPort Interface：僅負責通訊與異常處理
// Validation 完全移回 Domain Layer（ai.validator.ts）

import type { ActionResult } from "@/domain/shared/core.types";

export interface AiPromptOptions {
  model?:       string;   // 降級時覆蓋預設模型
  maxTokens?:   number;
  temperature?: number;
  jsonMode?:    boolean;  // 強制 JSON 回應格式
}

export interface AiResponse {
  text:         string;
  model:        string;  // 實際使用的模型（降級後可能不同）
  inputTokens:  number;
  outputTokens: number;
  totalTokens:  number;
}

export interface AiPort {
  /**
   * 純 LLM 生成：不負責驗證格式，僅負責通訊與異常處理
   * @param prompt 經 Orchestrator 組裝後的完整指令
   */
  generate(
    prompt: string,
    options?: AiPromptOptions
  ): Promise<ActionResult<AiResponse>>;

  /** 串流生成（未來擴展，目前 Admin 後台不需要）*/
  stream(
    prompt: string,
    options?: AiPromptOptions
  ): AsyncIterable<string>;
}
