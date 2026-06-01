import {
  getCommandCenterModuleMeta,
  listCommandCenterModuleManifests,
  type CommandCenterModuleManifest,
} from "@/server/command-center/registry/manifest";
import { loadCommandCenterModuleDefinition } from "@/server/command-center/registry/module-loaders";
import type {
  CommandCenterModule,
  CommandCenterModuleId,
} from "@/server/command-center/registry/types";
import type { z } from "zod";

export {
  commandCenterManifest,
  getCommandCenterModuleMeta,
  listCommandCenterModuleManifests,
} from "@/server/command-center/registry/manifest";
export { commandCenterModuleLoaders } from "@/server/command-center/registry/module-loaders";

/** @deprecated 請改用 getCommandCenterModuleMeta；完整模組請用 resolveCommandCenterModule */
export function getCommandCenterModule(
  id: CommandCenterModuleId
): CommandCenterModuleManifest | undefined {
  return getCommandCenterModuleMeta(id);
}

export function listCommandCenterModules(): CommandCenterModuleManifest[] {
  return listCommandCenterModuleManifests();
}

/** 動態載入模組定義（含 load / schema） */
export async function resolveCommandCenterModule(
  id: CommandCenterModuleId
): Promise<CommandCenterModule<z.ZodTypeAny> | undefined> {
  return loadCommandCenterModuleDefinition(id);
}

/** 載入並以模組 schema 驗證 payload（僅 import 目標模組 chunk） */
export async function loadCommandCenterModule(id: CommandCenterModuleId) {
  const mod = await loadCommandCenterModuleDefinition(id);
  if (!mod) {
    throw new Error(`Command center module not registered: ${id}`);
  }
  const payload = await mod.load();
  const parsed = mod.schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      `Module ${id} payload failed schema: ${parsed.error.message}`
    );
  }
  return parsed.data;
}

export function registerCommandCenterModule(
  _mod: CommandCenterModule<z.ZodTypeAny>
): void {
  throw new Error(
    "registerCommandCenterModule is disabled: add loader in module-loaders.ts and meta in manifest.ts"
  );
}

export type { CommandCenterModule, CommandCenterModuleId };
