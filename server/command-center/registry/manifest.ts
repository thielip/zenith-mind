import { seoModuleMeta } from "@/server/command-center/modules/seo/meta";
import type { CommandCenterModuleId } from "@/server/command-center/registry/types";

export type CommandCenterModuleManifest = {
  id: CommandCenterModuleId;
  title: string;
  route: string;
  revalidate?: number;
};

/** 僅靜態 metadata；模組實作透過 module-loaders 動態 import */
export const commandCenterManifest: Record<
  CommandCenterModuleId,
  CommandCenterModuleManifest | undefined
> = {
  seo: seoModuleMeta,
  "war-room": undefined,
  geo: undefined,
  ads: undefined,
  content: undefined,
  agent: undefined,
};

export function getCommandCenterModuleMeta(
  id: CommandCenterModuleId
): CommandCenterModuleManifest | undefined {
  return commandCenterManifest[id];
}

export function listCommandCenterModuleManifests(): CommandCenterModuleManifest[] {
  return Object.values(commandCenterManifest).filter(
    (m): m is CommandCenterModuleManifest => m != null
  );
}
