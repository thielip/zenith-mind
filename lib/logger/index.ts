// lib/logger/index.ts — Node Runtime
// 結構化 JSON Log（Vercel Log Drain 收集）
// 含 correlationId / jobId 全鏈路追蹤

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level:      LogLevel;
  timestamp:  string;
  message:    string;
  requestId?: string;
  jobId?:     string;
  action?:    string;
  userId?:    string;
  meta?:      Record<string, unknown>;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, ctx?: Omit<LogEntry, "level" | "timestamp" | "message">): void {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...ctx,
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    // info → stdout（Vercel 收集）
    // eslint-disable-next-line no-console
    console.log(output);
  }
}

export const logger = {
  info:  (msg: string, ctx?: Omit<LogEntry, "level" | "timestamp" | "message">) => log("info",  msg, ctx),
  warn:  (msg: string, ctx?: Omit<LogEntry, "level" | "timestamp" | "message">) => log("warn",  msg, ctx),
  error: (msg: string, ctx?: Omit<LogEntry, "level" | "timestamp" | "message">) => log("error", msg, ctx),
};
