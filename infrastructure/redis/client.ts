// infrastructure/redis/client.ts
// Upstash Redis 客戶端（REST API，Edge + Node 雙相容）

import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();
