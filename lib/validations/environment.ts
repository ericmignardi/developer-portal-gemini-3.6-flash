import { z } from "zod";

export const platformEnum = z.enum(["VERCEL", "NEON", "LOCAL", "OTHER"]);
export const environmentTypeEnum = z.enum(["PRODUCTION", "PREVIEW", "DEVELOPMENT"]);

export const environmentSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  name: z.string().min(1, "Environment name is required"),
  platform: platformEnum.default("OTHER"),
  type: environmentTypeEnum.default("DEVELOPMENT"),
  branch: z.string().nullable().optional(),
  url: z.string().url("Must be a valid URL").or(z.literal("")).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const environmentUpdateSchema = environmentSchema.partial().omit({ projectId: true });

export type EnvironmentInput = z.infer<typeof environmentSchema>;
export type EnvironmentUpdateInput = z.infer<typeof environmentUpdateSchema>;
