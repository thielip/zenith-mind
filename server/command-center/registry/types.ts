import type { z } from "zod";

export type CommandCenterModuleId =
  | "seo"
  | "war-room"
  | "geo"
  | "ads"
  | "content"
  | "agent";

export interface CommandCenterModule<TSchema extends z.ZodTypeAny> {
  id: CommandCenterModuleId;
  title: string;
  /** Admin dashboard path */
  route: string;
  revalidate?: number;
  schema: TSchema;
  load: () => Promise<z.infer<TSchema>>;
}
