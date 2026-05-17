"use client";

import { create } from "zustand";

interface CommandUiState {
  activeGranularity: "today" | "7d" | "30d";
  terminalLines: string[];
  criticalModuleId: string | null;
  setGranularity: (g: CommandUiState["activeGranularity"]) => void;
  pushTerminalLine: (line: string) => void;
  setCriticalModule: (id: string | null) => void;
}

export const useCommandUiStore = create<CommandUiState>((set) => ({
  activeGranularity: "7d",
  terminalLines: [],
  criticalModuleId: null,
  setGranularity: (activeGranularity) => set({ activeGranularity }),
  pushTerminalLine: (line) =>
    set((s) => ({
      terminalLines: [`[${new Date().toLocaleTimeString("zh-TW")}] ${line}`, ...s.terminalLines].slice(0, 80),
    })),
  setCriticalModule: (criticalModuleId) => set({ criticalModuleId }),
}));
