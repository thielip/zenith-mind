import type { RealtimeEvent } from "@/types/command-center/realtime";

type Listener = (event: RealtimeEvent) => void;

const globalHub = globalThis as unknown as {
  __ccEventHub?: {
    listeners: Set<Listener>;
    buffer: RealtimeEvent[];
  };
};

function getHub() {
  if (!globalHub.__ccEventHub) {
    globalHub.__ccEventHub = { listeners: new Set(), buffer: [] };
  }
  return globalHub.__ccEventHub;
}

const MAX_BUFFER = 200;

export function publishRealtimeEvent(event: RealtimeEvent) {
  const hub = getHub();
  hub.buffer.push(event);
  if (hub.buffer.length > MAX_BUFFER) {
    hub.buffer = hub.buffer.slice(-MAX_BUFFER);
  }
  for (const listener of hub.listeners) {
    listener(event);
  }
}

export function subscribeRealtime(listener: Listener) {
  const hub = getHub();
  hub.listeners.add(listener);
  return () => hub.listeners.delete(listener);
}

export function getRealtimeBuffer(): RealtimeEvent[] {
  return [...getHub().buffer];
}

export function createRealtimeEvent(
  partial: Omit<RealtimeEvent, "id" | "ts">
): RealtimeEvent {
  return {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    ...partial,
  };
}
