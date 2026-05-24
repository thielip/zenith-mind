"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  realtimeEventSchema,
  type RealtimeEvent,
} from "@/types/command-center/realtime";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCommandUiStore } from "@/stores/command-ui-store";

const QUERY_KEY = ["command-center", "realtime-events"] as const;

class RealtimeConnectionManager {
  private static instance: RealtimeConnectionManager | null = null;
  private source: EventSource | null = null;
  private subscribers = 0;

  static getInstance() {
    if (!RealtimeConnectionManager.instance) {
      RealtimeConnectionManager.instance = new RealtimeConnectionManager();
    }
    return RealtimeConnectionManager.instance;
  }

  subscribe(onEvent: (data: unknown) => void) {
    this.subscribers += 1;
    if (!this.source) {
      this.source = new EventSource("/api/admin/realtime/stream");
      this.source.onmessage = (ev) => {
        try {
          onEvent(JSON.parse(ev.data));
        } catch {
          /* ignore malformed */
        }
      };
      this.source.onerror = () => {
        this.cleanup();
      };
    }
    return () => {
      this.subscribers -= 1;
      if (this.subscribers <= 0) this.cleanup();
    };
  }

  private cleanup() {
    if (this.source) {
      this.source.onmessage = null;
      this.source.onerror = null;
      this.source.close();
    }
    this.source = null;
    this.subscribers = 0;
  }
}

export function useRealtimeStream() {
  const queryClient = useQueryClient();
  const pushEvent = useCommandUiStore((s) => s.pushTerminalLine);
  const mounted = useRef(false);

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<RealtimeEvent[]> => [],
    staleTime: Infinity,
  });

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const manager = RealtimeConnectionManager.getInstance();
    return manager.subscribe((raw) => {
      const parsed = realtimeEventSchema.safeParse(raw);
      if (!parsed.success) return;
      queryClient.setQueryData(QUERY_KEY, (prev: typeof parsed.data[] | undefined) => {
        const next = [parsed.data, ...(prev ?? [])].slice(0, 100);
        return next;
      });
      pushEvent(parsed.data.message);
    });
  }, [queryClient, pushEvent]);

  const events = query.data ?? [];
  const debouncedEvents = useDebouncedValue(events, 250);

  return { events: debouncedEvents, isLoading: query.isLoading };
}
