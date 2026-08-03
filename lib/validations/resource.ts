import { z } from "zod";

export const resourceTypeEnum = z.enum(["ARTICLE", "DOCS", "VIDEO", "TOOL", "REPO", "OTHER"]);

export const resourceSchema = z.object({
  title: z.string().min(1, "Resource title is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().nullable().optional(),
  type: resourceTypeEnum.default("OTHER"),
  projectId: z.string().nullable().optional(),
  isRead: z.boolean().default(false),
  tagIds: z.array(z.string()).optional(),
});

export const resourceUpdateSchema = resourceSchema.partial();

export type ResourceInput = z.infer<typeof resourceSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;
