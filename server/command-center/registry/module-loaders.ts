import type { CommandCenterModule } from "@/server/command-center/registry/types";
import type { CommandCenterModuleId } from "@/server/command-center/registry/types";
import type { z } from "zod";

export type CommandCenterModuleLoader = () => Promise<
  CommandCenterModule<z.ZodTypeAny>
>;

/**
 * 各模組以 import() 動態載入，避免 Registry 入口靜態拉入全部 Serverless 依賴。
 * 新增模組時只在此註冊 loader，並在 manifest.ts 加入 metadata。
 */
export const commandCenterModuleLoaders: Partial<
  Record<CommandCenterModuleId, CommandCenterModuleLoader>
> = {
  seo: () =>
    import("@/server/command-center/modules/seo/module").then(
      (m) => m.seoCommandCenterModule
    ),
};

export async function loadCommandCenterModuleDefinition(
  id: CommandCenterModuleId
): Promise<CommandCenterModule<z.ZodTypeAny> | undefined> {
  const loader = commandCenterModuleLoaders[id];
  if (!loader) return undefined;
  return loader();
}
