import { z } from "zod";

export const projectStatusEnum = z.enum(["IDEA", "ACTIVE", "PAUSED", "SHIPPED", "ARCHIVED"]);

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  client: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: projectStatusEnum.default("ACTIVE"),
  repoUrl: z.string().url("Must be a valid URL").or(z.literal("")).nullable().optional(),
  liveUrl: z.string().url("Must be a valid URL").or(z.literal("")).nullable().optional(),
  techStack: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
  startedAt: z.coerce.date().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

export const projectUpdateSchema = projectSchema.partial();

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
