// domain/ai/queue.port.ts
// QueuePort Interface：Transport + Ack/Fail 模型
// Idempotency 由 DB（idempotencyKey UNIQUE）承擔，Port 不負責
// 底層可無痛從 Redis 換成 AWS SQS 或 BullMQ

import type { ActionResult, ActionError } from "@/domain/shared/core.types";

export interface QueueJobPayload {
  jobId:   string;
  type:    string;
  version: number;   // DTO 版本校驗，防止滾動更新期間格式不符
  data:    unknown;
}

export interface EnqueueOptions {
  delaySeconds?: number;
  metadata?:     Record<string, unknown>;
}

export interface QueuePort {
  /** 入隊：僅負責可靠傳輸 */
  enqueue(
    payload: QueueJobPayload,
    options?: EnqueueOptions
  ): Promise<ActionResult<void>>;

  /** 出隊：由 Worker 呼叫 */
  dequeue(): Promise<ActionResult<QueueJobPayload | null>>;

  /** 確認完成：從佇列移除 */
  ack(jobId: string): Promise<ActionResult<void>>;

  /** 處理失敗：觸發重試邏輯或丟入死信佇列 */
  fail(jobId: string, error: ActionError): Promise<ActionResult<void>>;

  /** 查詢佇列積壓深度（監控用）*/
  depth(): Promise<number>;
}
