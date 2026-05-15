// infrastructure/redis/ai-queue.redis-adapter.ts
// QueuePort 的 Redis 實作（Upstash Redis List）
// ⚠ Node Runtime Only

import { redis } from "./client";
import type { QueuePort, QueueJobPayload, EnqueueOptions } from "@/domain/ai/queue.port";
import type { ActionResult, ActionError } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

const QUEUE_KEY     = "ai:queue";
const DEAD_LETTER   = "ai:dead-letter";

export class RedisQueueAdapter implements QueuePort {
  async enqueue(
    payload: QueueJobPayload,
    options?: EnqueueOptions
  ): Promise<ActionResult<void>> {
    try {
      const data = JSON.stringify(payload);

      if (options?.delaySeconds && options.delaySeconds > 0) {
        // Upstash 不支援原生延遲，用 ZADD 按 score（執行時間）排序
        const executeAt = Date.now() + options.delaySeconds * 1000;
        await redis.zadd("ai:delayed-queue", { score: executeAt, member: data });
      } else {
        await redis.rpush(QUEUE_KEY, data);
      }

      return { success: true, data: undefined, error: null };
    } catch (err: unknown) {
      console.error("[Queue] enqueue error:", err);
      return { success: false, data: null, error: Errors.internal() };
    }
  }

  async dequeue(): Promise<ActionResult<QueueJobPayload | null>> {
    try {
      // 先將到期的延遲任務移入主佇列
      await this.promoteDelayed();

      const raw = await redis.lpop<string>(QUEUE_KEY);
      if (!raw) return { success: true, data: null, error: null };

      const payload = JSON.parse(raw) as QueueJobPayload;
      return { success: true, data: payload, error: null };
    } catch (err: unknown) {
      console.error("[Queue] dequeue error:", err);
      return { success: false, data: null, error: Errors.internal() };
    }
  }

  async ack(jobId: string): Promise<ActionResult<void>> {
    // Redis List 在 lpop 時已移除，ack 只需記錄 log
    console.warn(`[Queue] ack jobId=${jobId}`);
    return { success: true, data: undefined, error: null };
  }

  async fail(jobId: string, error: ActionError): Promise<ActionResult<void>> {
    try {
      await redis.rpush(
        DEAD_LETTER,
        JSON.stringify({ jobId, error, failedAt: new Date().toISOString() })
      );
      return { success: true, data: undefined, error: null };
    } catch (err: unknown) {
      console.error("[Queue] fail error:", err);
      return { success: false, data: null, error: Errors.internal() };
    }
  }

  async depth(): Promise<number> {
    return (await redis.llen(QUEUE_KEY)) ?? 0;
  }

  /** 將到期的延遲任務移入主佇列 */
  private async promoteDelayed(): Promise<void> {
    const now = Date.now();
    // 取出 score <= now 的任務
    const items = await redis.zrange<string[]>(
      "ai:delayed-queue",
      0,
      now,
      { byScore: true, offset: 0, count: 10 }
    );
    if (!items || items.length === 0) return;

    for (const item of items) {
      await redis.rpush(QUEUE_KEY, item as string);
      await redis.zrem("ai:delayed-queue", item as string);
    }
  }
}

export const aiQueue = new RedisQueueAdapter();
